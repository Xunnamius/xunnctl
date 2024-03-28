import assert from 'node:assert';

import { ExtendedLogger } from 'multiverse/rejoinder';
import { makeApiCallerBase } from 'universe/api';
import { loadFromCliConfig } from 'universe/config-manager';
import { LogTag } from 'universe/constant';
import { ErrorMessage } from 'universe/error';

import type { JsonValue, PartialDeep } from 'type-fest';
import type {
  HostileIp,
  Metadata,
  ResourceRecord,
  Ruleset,
  RulesetRule,
  WithId,
  Zone
} from './types';

export * from './types';

export async function makeCloudflareApiCaller({
  configPath,
  debug: debug_,
  log
}: { configPath: string; log: ExtendedLogger } & Parameters<
  typeof makeApiCallerBase
>[0]) {
  const callApi_ = makeApiCallerBase({ debug: debug_ });

  return {
    /**
     * - https://developers.cloudflare.com/api
     *
     * Returns a cloudflare-specific fetch wrapper for making API calls.
     */
    async callApi<Result = undefined, ResponseJson extends JsonValue = JsonValue>(
      callApiOptions: Parameters<typeof callApi_>[0],
      { parseResultJson = true }: { parseResultJson?: boolean } = {}
    ): Promise<
      Result extends undefined
        ? [result: Response, responseBody: string]
        : [result: Result, responseJson: ResponseJson]
    > {
      const { message: logMessage, error: logError } = log.extend('api:cf');
      const debug = debug_.extend('api:cf:verbose');

      const apiUriBase = await loadFromCliConfig({ configPath, key: 'cfApiUriBase' });
      const apiToken = await loadFromCliConfig({ configPath, key: 'cfApiToken' });

      assert(
        typeof apiUriBase === 'string',
        ErrorMessage.AssertionFailureInvalidConfig('cfApiUriBase')
      );

      assert(
        typeof apiToken === 'string',
        ErrorMessage.AssertionFailureInvalidConfig('cfApiToken')
      );

      const headers = new Headers(callApiOptions.headers);
      headers.set('Content-Type', 'application/json');
      headers.set('Authorization', `bearer ${apiToken}`);

      callApiOptions.uri = `${apiUriBase}/${callApiOptions.uri}`;
      callApiOptions.headers = headers;

      const [res, responseBody] = await callApi_(callApiOptions);

      if (parseResultJson) {
        debug('parsing response data as JSON');

        const responseJson = JSON.parse(responseBody);
        const { success, errors, result, messages } = responseJson;

        if (messages.length) {
          debug('parsing response data as JSON');
          messages.forEach((message: string) =>
            logMessage([LogTag.IF_NOT_HUSHED], message)
          );
        }

        if (!success) {
          debug('response indicates request was unsuccessful');

          let totalErrorMessage = '';
          if (Array.isArray(errors) && errors?.length) {
            errors.forEach(({ code, message }) => {
              const errorMessage = `[${code}]: ${message}\n`;
              totalErrorMessage += errorMessage;
              logError([LogTag.IF_NOT_SILENCED], errorMessage);
            });
          } else {
            totalErrorMessage = '(request failed but no error message was returned)';
            logError([LogTag.IF_NOT_SILENCED], totalErrorMessage);
          }

          throw new Error(`terminated due to API error(s): ${totalErrorMessage}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [result, responseJson] as any;
      } else {
        debug('not parsing response data');
        debug('manually ensuring response is ok (i.e. 2xx status)');

        if (!res.ok) {
          throw new Error(`terminated due to API bad response status: ${res.status}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [res, responseBody] as any;
      }
    },

    /**
     * - https://developers.cloudflare.com/api/operations/zones-get
     *
     * @returns A list of DNS zone objects.
     */
    async getDnsZones() {
      const debug = debug_.extend('getDnsZones');
      debug('entered method');

      const zones: Zone[] = [];
      let currentPage = 0;
      let countRemaining = 0;

      do {
        const [
          zones_,
          metadata
          // eslint-disable-next-line no-await-in-loop
        ] = await this.callApi<Zone[], PartialDeep<Metadata>>({
          uri: `zones?page=${++currentPage}`,
          method: 'GET'
        });

        const { count, page, per_page, total_count } = metadata.result_info || {};

        zones.push(...zones_);

        if (
          count !== undefined &&
          page !== undefined &&
          per_page !== undefined &&
          total_count
        ) {
          countRemaining = total_count - (count + (page - 1) * per_page);
        }

        debug('zones.length: %O', zones.length);
        debug('countRemaining: %O', countRemaining);
      } while (countRemaining > 0);

      return zones;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/zones-post
     * - https://developers.cloudflare.com/api/operations/zone-settings-edit-zone-settings-info
     *
     * @return The ID of the newly created DNS zone.
     */
    async createDnsZone({
      subDomainName,
      accountId
    }: {
      subDomainName: string;
      accountId: string;
    }) {
      const debug = debug_.extend('createDnsZone');
      debug('entered method');

      const [{ id: zoneId }] = await this.callApi<WithId>({
        uri: 'zones',
        method: 'POST',
        body: {
          account: { id: accountId },
          name: subDomainName,
          type: 'full'
        }
      });

      await this.reinitializeDnsZone({ zoneId });
      return zoneId;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/zones-get
     */
    async getDnsZone({ domainName }: { domainName: string }) {
      const debug = debug_.extend('getDnsZoneId');
      debug('entered method');

      const zone = await this.callApi<Zone[]>({
        uri: `zones?name=${domainName}`,
        method: 'GET'
      }).then(([zones]) => {
        debug('searching for %O', domainName);

        const zone = zones.find(({ name }: { name: string }) => {
          debug('saw %O', name);
          return name === domainName;
        });

        debug('selected zone: %O', zone);

        return zone;
      });

      return zone;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/zones-get
     *
     * @return The ID of the DNS zone.
     */
    async getDnsZoneId({ domainName }: { domainName: string }) {
      const debug = debug_.extend('getDnsZoneId');
      debug('entered method');

      const zone = await this.getDnsZone({ domainName });
      const zoneId = zone?.id;

      debug('selected zone.id: %O', zoneId);
      return zoneId;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/zones-patch
     *
     * Updates/overwrites the settings of the specified zone.
     */
    async reinitializeDnsZone({ zoneId }: { zoneId: string }): Promise<void> {
      const debug = debug_.extend('reinitializeDnsZone');
      debug('entered method');

      await this.callApi({
        uri: `zones/${zoneId}/settings`,
        method: 'PATCH',
        body: {
          items: [
            { id: 'always_use_https', value: 'on' },
            { id: 'ipv6', value: 'on' },
            { id: 'ssl', value: 'strict' },
            { id: 'min_tls_version', value: '1.2' }
          ]
        }
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/zones-0-delete
     *
     * Completely destroys a zone.
     */
    async deleteDnsZone({ zoneId }: { zoneId: string }) {
      const debug = debug_.extend('deleteDnsZone');
      debug('entered method');

      await this.callApi<WithId>({ uri: `zones/${zoneId}`, method: 'DELETE' });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records
     *
     * Note that `fullRecordName` must be the **FULLY QUALIFIED RECORD NAME** of
     * the record that includes the zone apex itself (e.g. "\*.xunn.at" instead
     * of just "\*" when trying to retrieve said CNAME record).
     *
     * @return The ID of a DNS record.
     */
    async getDnsRecord({
      zoneId,
      fullRecordName,
      recordType
    }: {
      zoneId: string;
      fullRecordName: string;
      recordType: string;
    }) {
      const debug = debug_.extend('getDnsRecord');
      debug('entered method');

      const recordId = await this.callApi<ResourceRecord[]>({
        uri: `zones/${zoneId}/dns_records?name=${fullRecordName}&type=${recordType}`,
        method: 'GET'
      }).then(([records]) => {
        debug('searching for %O', fullRecordName);

        const record = records.find(({ name }: { name: string }) => {
          debug('saw %O', name);
          return name === fullRecordName;
        });

        debug('selected record: %O', record);

        return record;
      });

      return recordId;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records
     *
     * Note that `targetRecordName` must be the **FULLY QUALIFIED RECORD NAME**
     * of the record that includes the zone apex itself (e.g. "*.xunn.at"
     * instead of just "*" when trying to retrieve said CNAME record).
     *
     * @return The ID of a DNS record.
     */
    async getDnsRecordId({
      zoneId,
      fullRecordName,
      recordType
    }: {
      zoneId: string;
      fullRecordName: string;
      recordType: string;
    }) {
      const debug = debug_.extend('getDnsRecordId');
      debug('entered method');

      const record = await this.getDnsRecord({
        zoneId,
        fullRecordName,
        recordType
      });
      const recordId = record?.id;

      debug('selected record.id: %O', recordId);
      return recordId;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records
     *
     * @returns A list of DNS record objects.
     */
    async getDnsRecords({
      zoneId,
      targetRecordName,
      targetRecordType
    }: {
      zoneId: string;
      targetRecordName?: string;
      targetRecordType?: string;
    }) {
      const debug = debug_.extend('getDnsZoneRecords');
      debug('entered method');

      const records: ResourceRecord[] = [];
      let currentPage = 0;
      let countRemaining = 0;

      const additionalQuery = Object.entries({
        name: targetRecordName,
        type: targetRecordType
        // eslint-disable-next-line unicorn/no-array-reduce
      }).reduce(
        (str, [key, value]) => (value !== undefined ? `${str}&${key}=${value}` : str),
        ''
      );

      do {
        const [
          records_,
          metadata
          // eslint-disable-next-line no-await-in-loop
        ] = await this.callApi<ResourceRecord[], PartialDeep<Metadata>>({
          uri: `zones/${zoneId}/dns_records?page=${++currentPage}${additionalQuery}`,
          method: 'GET'
        });

        const { count, page, per_page, total_count } = metadata.result_info || {};

        records.push(...records_);

        if (
          count !== undefined &&
          page !== undefined &&
          per_page !== undefined &&
          total_count
        ) {
          countRemaining = total_count - (count + (page - 1) * per_page);
        }

        debug('records.length: %O', records.length);
        debug('countRemaining: %O', countRemaining);
      } while (countRemaining > 0);

      return records;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsARecord({
      zoneId,
      subRecordName,
      ipv4,
      ttl,
      proxied = false
    }: {
      zoneId: string;
      subRecordName: string;
      ipv4: string;
      ttl?: number;
      proxied: boolean;
    }): Promise<void> {
      const debug = debug_.extend('createDnsARecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        recordType: 'A',
        subRecordName,
        content: ipv4,
        ttl,
        proxied
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsAaaaRecord({
      zoneId,
      subRecordName,
      ipv6: content,
      ttl,
      proxied = false
    }: {
      zoneId: string;
      subRecordName: string;
      ipv6: string;
      ttl?: number;
      proxied: boolean;
    }): Promise<void> {
      const debug = debug_.extend('createDnsAaaaRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        recordType: 'AAAA',
        subRecordName,
        content,
        ttl,
        proxied
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     *
     * Creates pre-configured "issue" and "iodef" records.
     */
    async createDnsCaaRecords({ zoneId }: { zoneId: string }): Promise<void> {
      const debug = debug_.extend('createDnsCaaRecords');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        recordType: 'CAA',
        subRecordName: '@',
        data: {
          flags: 128,
          tag: 'issue',
          value: 'letsencrypt.org'
        }
      });

      await this.createDnsRecord({
        zoneId,
        recordType: 'CAA',
        subRecordName: '@',
        data: {
          flags: 128,
          tag: 'iodef',
          value: 'mailto:diagnostics@ergodark.com'
        }
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsCnameRecord({
      zoneId,
      subRecordName,
      redirectToHostname,
      ttl,
      proxied = false
    }: {
      zoneId: string;
      subRecordName: string;
      redirectToHostname: string;
      ttl?: number;
      proxied: boolean;
    }): Promise<void> {
      const debug = debug_.extend('createDnsCnameRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        recordType: 'CNAME',
        subRecordName,
        content: redirectToHostname,
        ttl,
        proxied
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsMxRecord({
      zoneId,
      subRecordName,
      mailHostname,
      ttl
    }: {
      zoneId: string;
      subRecordName: string;
      mailHostname: string;
      ttl?: number;
    }): Promise<void> {
      const debug = debug_.extend('createDnsMxRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        recordType: 'MX',
        subRecordName,
        content: mailHostname,
        priority: 1,
        ttl
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsTxtRecord({
      content,
      subRecordName,
      zoneId,
      ttl
    }: {
      zoneId: string;
      subRecordName: string;
      content: string;
      ttl?: number;
    }): Promise<void> {
      const debug = debug_.extend('createDnsTxtRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        recordType: 'TXT',
        subRecordName,
        content,
        ttl
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsRecord({
      zoneId,
      recordType,
      subRecordName,
      ttl = 1 /* TTL of 1 === "automatic" */,
      ...additionalOptions
    }: {
      zoneId: string;
      recordType: string;
      subRecordName: string;
      ttl?: number;
      [additionalOption: string]: unknown;
    }): Promise<void> {
      const debug = debug_.extend('createDnsRecord');
      debug('entered method');

      await this.callApi({
        uri: `zones/${zoneId}/dns_records`,
        method: 'POST',
        body: {
          name: subRecordName,
          type: recordType,
          ttl,
          ...additionalOptions
        }
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-delete-dns-record
     *
     * Completely destroys a DNS record.
     */
    async deleteDnsRecord({
      zoneId,
      recordId
    }: {
      zoneId: string;
      recordId: string;
    }): Promise<void> {
      const debug = debug_.extend('deleteDnsRecord');
      debug('entered method');

      await this.callApi({
        uri: `zones/${zoneId}/dns_records/${recordId}`,
        method: 'DELETE'
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/cloudflare-i-ps-cloudflare-ip-details
     *
     * @returns An object containing Cloudflare's public IPv4 and IPv6 addresses.
     */
    async getCloudflareIps() {
      const debug = debug_.extend('getCloudflareIps');
      debug('entered method');

      const [{ ipv4_cidrs: ipv4, ipv6_cidrs: ipv6 }] = await this.callApi<{
        ipv4_cidrs: string[];
        ipv6_cidrs: string[];
      }>({
        uri: 'ips',
        method: 'GET'
      });

      return { ipv4, ipv6 };
    },

    /**
     * https://developers.cloudflare.com/api/operations/createZoneRuleset
     *
     * Gets (or creates if it does not already exist) a custom firewall ruleset and
     * returns its ID. Note that the ruleset is created if it does not already exist.
     * If it already exists, it will simply be returned instead.
     *
     * @returns The ID of the ruleset.
     */
    async getDnsZoneCustomFirewallRulesetId({
      zoneId,
      rulesetPhaseName
    }: {
      zoneId: string;
      rulesetPhaseName: string;
    }) {
      const debug = debug_.extend('getDnsZoneCustomFirewallRulesetId');
      debug('entered method');

      const rulesetId = await this.getDnsZoneCustomFirewallRuleset({
        zoneId,
        rulesetPhaseName
      }).then(async (ruleset) => {
        if (ruleset?.id) {
          debug('using existing custom firewall ruleset: %O', ruleset.id);
          return ruleset.id;
        } else {
          debug('creating new custom firewall ruleset...');

          const [createdRuleset] = await this.callApi<WithId>({
            uri: `zones/${zoneId}/rulesets`,
            method: 'POST',
            body: {
              description: '',
              kind: 'zone',
              name: 'fail2ban-ip-block-list-connector',
              phase: rulesetPhaseName,
              rules: []
            }
          });

          debug('new ruleset: %O', createdRuleset);
          return createdRuleset.id;
        }
      });

      return rulesetId;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/listZoneRulesets
     *
     * @returns The zone's custom firewall ruleset or `undefined` if it does not
     * exist.
     */
    async getDnsZoneCustomFirewallRuleset({
      zoneId,
      rulesetPhaseName
    }: {
      zoneId: string;
      rulesetPhaseName: string;
    }) {
      const debug = debug_.extend('getDnsZoneCustomFirewallRuleset');
      debug('entered method');

      debug('searching for %O', rulesetPhaseName);

      const ruleset = (await this.getDnsZoneRulesets({ zoneId })).find((ruleset) => {
        debug('saw ruleset phase %O', ruleset.phase);
        return ruleset.phase === rulesetPhaseName;
      });

      debug('selected ruleset: %O', ruleset);
      debug('selected ruleset.id: %O', ruleset?.id);

      return ruleset;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/listZoneRulesets
     *
     * @returns A list of the zone's rulesets.
     */
    async getDnsZoneRulesets({ zoneId }: { zoneId: string }) {
      const debug = debug_.extend('getDnsZoneRulesets');
      debug('entered method');

      const [rulesets] = await this.callApi<Ruleset[]>({
        uri: `zones/${zoneId}/rulesets`,
        method: 'GET'
      });

      return rulesets;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/createZoneRulesetRule
     *
     * This function will not allow rules with duplicate descriptions by default.
     * This can be overridden by providing `{ allowDuplicate: true }`.
     *
     * @return The newly created ruleset rule's ID.
     */
    async createDnsZoneCustomFirewallRulesetRule({
      zoneId,
      ruleAction,
      ruleExpression,
      ruleDescription,
      allowDuplicate,
      rulesetPhaseName,
      ...additionalOptions
    }: {
      zoneId: string;
      ruleAction: string;
      ruleExpression: string;
      ruleDescription: string;
      allowDuplicate?: boolean;
      rulesetPhaseName: string;
      [additionalOption: string]: unknown;
    }) {
      const debug = debug_.extend('createDnsZoneCustomFirewallRulesetRule');
      debug('entered method');

      const rulesetRuleId = await this.getDnsZoneCustomFirewallRulesetId({
        zoneId,
        rulesetPhaseName
      }).then(async (rulesetId) => {
        if (!allowDuplicate) {
          const existingRules = await this.getDnsZoneRulesetRules({
            zoneId,
            rulesetId
          });

          const matchesDescription = (rule: RulesetRule) => {
            debug(
              `error check: rule.description === description ("${rule.description}" === "${ruleDescription}")`
            );

            return rule.description === ruleDescription;
          };

          if (existingRules.some((rule) => matchesDescription(rule))) {
            throw new Error(
              `cannot create dns zone custom firewall ruleset rule with duplicate description "${ruleDescription}"`
            );
          }
        }

        return this.createDnsZoneRulesetRule({
          zoneId,
          rulesetId,
          action: ruleAction,
          expression: ruleExpression,
          description: ruleDescription,
          ...additionalOptions
        });
      });

      return rulesetRuleId;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/getZoneRuleset
     *
     * @returns A list of ruleset rules.
     */
    async getDnsZoneCustomFirewallRulesetRules({
      zoneId,
      rulesetPhaseName
    }: {
      zoneId: string;
      rulesetPhaseName: string;
    }) {
      const debug = debug_.extend('getDnsZoneCustomFirewallRulesetRules');
      debug('entered method');

      const rules = await this.getDnsZoneCustomFirewallRulesetId({
        zoneId,
        rulesetPhaseName
      }).then((rulesetId) => {
        return this.getDnsZoneRulesetRules({ zoneId, rulesetId });
      });

      return rules;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/deleteZoneRuleset
     *
     * Completely deletes a zone-level ruleset.
     */
    async deleteDnsZoneCustomFirewallRuleset({
      zoneId,
      rulesetPhaseName
    }: {
      zoneId: string;
      rulesetPhaseName: string;
    }) {
      const debug = debug_.extend('deleteDnsZoneCustomFirewallRuleset');
      debug('entered method');

      const rulesetId = await this.getDnsZoneCustomFirewallRulesetId({
        zoneId,
        rulesetPhaseName: rulesetPhaseName
      });

      await this.callApi<undefined>(
        {
          uri: `zones/${zoneId}/rulesets/${rulesetId}`,
          method: 'DELETE'
        },
        { parseResultJson: false }
      );
    },

    /**
     * - https://developers.cloudflare.com/api/operations/createZoneRulesetRule
     *
     * @return The newly created ruleset rule's ID.
     */
    async createDnsZoneRulesetRule({
      zoneId,
      rulesetId,
      action,
      expression,
      description,
      ...additionalOptions
    }: {
      zoneId: string;
      rulesetId: string;
      action: string;
      expression: string;
      description: string;
      [additionalOption: string]: unknown;
    }) {
      const debug = debug_.extend('createDnsZoneRulesetRule');
      debug('entered method');

      const [{ id: rulesetRuleId }] = await this.callApi<WithId>({
        uri: `zones/${zoneId}/rulesets/${rulesetId}/rules`,
        method: 'POST',
        body: {
          action,
          expression,
          description,
          enabled: true,
          ...additionalOptions
        }
      });

      return rulesetRuleId;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/getZoneRuleset
     *
     * @returns A list of ruleset rules.
     */
    async getDnsZoneRulesetRules({
      rulesetId,
      zoneId
    }: {
      zoneId: string;
      rulesetId: string;
    }) {
      const debug = debug_.extend('getDnsZoneRulesetRules');
      debug('entered method');

      const [{ rules }] = await this.callApi<Ruleset>({
        uri: `zones/${zoneId}/rulesets/${rulesetId}`,
        method: 'GET'
      });
      return rules || [];
    },

    /**
     * - https://developers.cloudflare.com/api/operations/lists-get-list-items
     */
    async getHostileIps({ accountId, listId }: { accountId: string; listId: string }) {
      const debug = debug_.extend('getHostileIps');
      debug('entered method');

      const ips: HostileIp[] = [];
      let next = undefined as string | undefined;

      do {
        const [
          ips_,
          metadata
          // eslint-disable-next-line no-await-in-loop
        ] = await this.callApi<HostileIp[], PartialDeep<Metadata>>({
          uri: `accounts/${accountId}/rules/lists/${listId}/items?${next ? 'cursor=' + next : ''}`,
          method: 'GET'
        });

        ips.push(...ips_);
        next = metadata.result_info?.cursors?.after;

        debug('ips.length: %O', ips.length);
      } while (next);

      return ips;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/lists-delete-list-items
     *
     * Completely deletes one or more IPs.
     */
    async deleteHostileIps({
      accountId,
      listId,
      listItemIds
    }: {
      accountId: string;
      listId: string;
      listItemIds: string[];
    }) {
      const debug = debug_.extend('deleteHostileIp');
      debug('entered method');

      await this.callApi<undefined>(
        {
          uri: `accounts/${accountId}/rules/lists/${listId}/items`,
          method: 'DELETE',
          body: {
            items: listItemIds.map((id) => {
              debug(`DELETE: ${id}`);
              return { id };
            })
          }
        },
        { parseResultJson: false }
      );
    },

    /**
     * - https://developers.cloudflare.com/api/operations/lists-create-list-items
     */
    async addHostileIps({
      accountId,
      listId,
      targetIps,
      comment
    }: {
      accountId: string;
      listId: string;
      targetIps: string[];
      comment?: string;
    }) {
      const debug = debug_.extend('addHostileIps');
      debug('entered method');

      await this.callApi<undefined>(
        {
          uri: `accounts/${accountId}/rules/lists/${listId}/items`,
          method: 'POST',
          body: targetIps.map((ip) => {
            debug(`ADD: ${ip} (%O)`, comment);
            return {
              ip,
              comment: 'Created by xunnctl' + (comment ? ` (${comment})` : '')
            };
          })
        },
        { parseResultJson: false }
      );
    }
  };
}

/**
 * Lightweight type guard.
 */
export function isCfResourceRecord(obj: unknown): obj is ResourceRecord {
  return !!obj && typeof obj === 'object' && 'content' in obj;
}
