import { ExtendedLogger } from 'multiverse/rejoinder';
import { JsonValue } from 'type-fest';
import { makeApiCaller } from 'universe/api';
import { loadFromCliConfig } from 'universe/config-manager';
import { LogTag } from 'universe/constant';

/**
 * @internal
 */
export type WithId<T = unknown> = { id: string } & T;

/**
 * https://developers.cloudflare.com/api/operations/listZoneRulesets
 * @internal
 */
export type Rulesets = Omit<Ruleset, 'rules'>[];

/**
 * https://developers.cloudflare.com/api/operations/getZoneRuleset
 * @internal
 */
export type Ruleset = WithId<{
  name: string;
  description: string;
  rules: RulesetRule[];
  phase: string;
}>;

/**
 * https://developers.cloudflare.com/api/operations/getZoneRuleset
 * @internal
 */
export type RulesetRule = WithId<{ description: string }>;

/**
 * https://developers.cloudflare.com/api/operations/zones-get
 * @internal
 */
export type Zone = WithId<{ name: string }>;

export async function makeCloudflareApiCaller({
  configPath,
  debug: debug_,
  log
}: { configPath: string; log: ExtendedLogger } & Parameters<typeof makeApiCaller>[0]) {
  const callApi_ = makeApiCaller({ debug: debug_ });

  return {
    /**
     * - https://developers.cloudflare.com/api
     *
     * Returns a cloudflare-specific fetch wrapper for making API calls.
     */
    async callApi<Result = unknown, ResponseJson extends JsonValue = JsonValue>(
      callApiOptions: Parameters<typeof callApi_>[0]
    ): Promise<[result: Result, responseJson: ResponseJson]> {
      const { message: logMessage, error: logError } = log.extend('api:cf');

      const apiUriBase = await loadFromCliConfig({ configPath, key: 'cfApiUriBase' });
      const apiToken = await loadFromCliConfig({ configPath, key: 'cfApiToken' });

      const headers = new Headers(callApiOptions.headers);
      headers.set('Content-Type', 'application/json');
      headers.set('Authorization', `bearer ${apiToken}`);

      callApiOptions.uri = `${apiUriBase}/${callApiOptions.uri}`;
      callApiOptions.headers = headers;

      const [, responseBody] = await callApi_(callApiOptions);

      const responseJson = JSON.parse(responseBody);
      const { success, errors, result, messages } = responseJson;

      if (messages.length) {
        messages.forEach((message: string) =>
          logMessage([LogTag.IF_NOT_HUSHED], message)
        );
      }

      if (!success) {
        if (Array.isArray(errors) && errors?.length) {
          errors.forEach(({ code, message }) =>
            logError([LogTag.IF_NOT_SILENCED], `[${code}]: ${message}\n`)
          );
        } else {
          logError(
            [LogTag.IF_NOT_SILENCED],
            '(request failed but no error message was returned)'
          );
        }

        throw new Error('terminated due to reported API error');
      }

      return [result, responseJson];
    },

    /**
     * - https://developers.cloudflare.com/api/operations/zones-get
     *
     * @returns A list of DNS zone objects.
     */
    async getAllDnsZones() {
      const debug = debug_.extend('getAllDnsZones');
      debug('entered method');

      const zones: Zone[] = [];
      let currentPage = 0;
      let countRemaining = 0;

      do {
        const [
          zones_,
          {
            result_info: { count, page, per_page, total_count }
          }
          // eslint-disable-next-line no-await-in-loop
        ] = await this.callApi<
          Zone[],
          {
            result_info: {
              count: number;
              page: number;
              per_page: number;
              total_count: number;
            };
          }
        >({
          uri: `zones?page=${++currentPage}`,
          method: 'GET'
        });

        zones.push(...zones_);
        countRemaining = total_count - (count + (page - 1) * per_page);

        debug('(getAllDnsZones) zones.length: %O', zones.length);
        debug('(getAllDnsZones) countRemaining: %O', countRemaining);
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
      domainName,
      accountId
    }: {
      domainName: string;
      accountId: string;
    }) {
      const debug = debug_.extend('createDnsZone');
      debug('entered method');

      const [{ id: zoneId }] = await this.callApi<WithId>({
        uri: 'zones',
        method: 'POST',
        body: {
          account: { id: accountId },
          name: domainName,
          type: 'full'
        }
      });

      await this.reinitializeDnsZone({ zoneId });
      return zoneId;
    },

    /**
     * - https://developers.cloudflare.com/api/operations/zones-get
     *
     * @return The ID of the DNS zone.
     */
    async getDnsZoneId({ domainName }: { domainName: string }) {
      const debug = debug_.extend('getDnsZoneId');
      debug('entered method');

      const zoneId = await this.callApi<Zone[]>({
        uri: `zones?name=${domainName}`,
        method: 'GET'
      }).then(([zones]) => {
        debug('searching for %O', domainName);

        const zone = zones.find(({ name }: { name: string }) => {
          debug('saw %O', name);
          return name === domainName;
        });

        debug('selected zone: %O', zone);
        debug('selected zone.id: %O', zone?.id);

        return zone?.id;
      });

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
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsARecord({
      zoneId,
      domainName,
      ipv4,
      proxied = false
    }: {
      zoneId: string;
      domainName: string;
      ipv4: string;
      proxied: boolean;
    }): Promise<void> {
      const debug = debug_.extend('createDnsARecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        type: 'A',
        domainName,
        content: ipv4,
        proxied
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsAaaaRecord({
      domainName,
      ipv6: content,
      zoneId,
      proxied = false
    }: {
      zoneId: string;
      domainName: string;
      ipv6: string;
      proxied: boolean;
    }): Promise<void> {
      const debug = debug_.extend('createDnsAaaaRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        type: 'AAAA',
        domainName,
        content,
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
        type: 'CAA',
        domainName: '@',
        data: {
          flags: 128,
          tag: 'issue',
          value: 'letsencrypt.org'
        }
      });

      await this.createDnsRecord({
        zoneId,
        type: 'CAA',
        domainName: '@',
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
      domainName,
      redirectToHostname,
      zoneId,
      proxied = false
    }: {
      zoneId: string;
      domainName: string;
      redirectToHostname: string;
      proxied: boolean;
    }): Promise<void> {
      const debug = debug_.extend('createDnsCnameRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        type: 'CNAME',
        domainName,
        content: redirectToHostname,
        proxied
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsMxRecord({
      zoneId,
      domainName,
      mailHostname
    }: {
      zoneId: string;
      domainName: string;
      mailHostname: string;
    }): Promise<void> {
      const debug = debug_.extend('createDnsMxRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        type: 'MX',
        domainName,
        content: mailHostname,
        priority: 1
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsTxtRecord({
      content,
      domainName,
      zoneId
    }: {
      zoneId: string;
      domainName: string;
      content: string;
    }): Promise<void> {
      const debug = debug_.extend('createDnsTxtRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneId,
        type: 'TXT',
        domainName,
        content
      });
    },

    /**
     * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
     */
    async createDnsRecord({
      zoneId,
      type,
      domainName,
      ...additionalOptions
    }: {
      zoneId: string;
      type: string;
      domainName: string;
      [additionalOption: string]: unknown;
    }): Promise<void> {
      const debug = debug_.extend('createDnsRecord');
      debug('entered method');

      await this.callApi({
        uri: `zones/${zoneId}/dns_records`,
        method: 'POST',
        body: {
          name: domainName,
          type,
          ttl: 1,
          ...additionalOptions
        }
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
      phaseName
    }: {
      zoneId: string;
      phaseName: string;
    }) {
      const debug = debug_.extend('getDnsZoneCustomFirewallRulesetId');
      debug('entered method');

      const rulesetId = await this.getDnsZoneCustomFirewallRuleset({
        zoneId,
        phaseName
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
              name: 'default',
              phase: phaseName,
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
      phaseName
    }: {
      zoneId: string;
      phaseName: string;
    }) {
      const debug = debug_.extend('getDnsZoneCustomFirewallRuleset');
      debug('entered method');

      debug('searching for %O', phaseName);

      const ruleset = (await this.getDnsZoneRulesets({ zoneId })).find((ruleset) => {
        debug('saw ruleset phase %O', ruleset.phase);
        return ruleset.phase === phaseName;
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
      action,
      expression,
      description,
      allowDuplicate,
      phaseName,
      ...additionalOptions
    }: {
      zoneId: string;
      action: string;
      expression: string;
      description: string;
      allowDuplicate?: boolean;
      phaseName: string;
      [additionalOption: string]: unknown;
    }) {
      const debug = debug_.extend('createDnsZoneCustomFirewallRulesetRule');
      debug('entered method');

      const rulesetRuleId = await this.getDnsZoneCustomFirewallRulesetId({
        zoneId,
        phaseName
      }).then(async (rulesetId) => {
        if (!allowDuplicate) {
          const existingRules = await this.getDnsZoneRulesetRules({
            zoneId,
            rulesetId
          });
          const matchesDescription = (rule: RulesetRule) => {
            debug(
              `error check: rule.description === description ("${rule.description}" === "${description}")`
            );

            return rule.description === description;
          };

          if (existingRules.some((rule) => matchesDescription(rule))) {
            throw new Error(
              `cannot create dns zone custom firewall ruleset rule with duplicate description "${description}"`
            );
          }
        }

        return this.createDnsZoneRulesetRule({
          zoneId,
          rulesetId,
          action,
          expression,
          description,
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
      phaseName
    }: {
      zoneId: string;
      phaseName: string;
    }) {
      const debug = debug_.extend('getDnsZoneCustomFirewallRulesetRules');
      debug('entered method');

      const rules = await this.getDnsZoneCustomFirewallRulesetId({
        zoneId,
        phaseName
      }).then((rulesetId) => {
        return this.getDnsZoneRulesetRules({ zoneId, rulesetId });
      });

      return rules;
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
    }
  };
}
