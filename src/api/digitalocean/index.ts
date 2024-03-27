import assert from 'node:assert';

import { ExtendedLogger } from 'multiverse/rejoinder';
import { makeApiCallerBase } from 'universe/api';
import { loadFromCliConfig } from 'universe/config-manager';
import { LogTag } from 'universe/constant';
import { ErrorMessage } from 'universe/error';

import type { JsonValue } from 'type-fest';

import type { Domain, Domains, Links, ResourceRecord, ResourceRecords } from './types';

export * from './types';

export async function makeDigitalOceanApiCaller({
  configPath,
  debug: debug_,
  log
}: { configPath: string; log: ExtendedLogger } & Parameters<
  typeof makeApiCallerBase
>[0]) {
  const callApi_ = makeApiCallerBase({ debug: debug_ });

  return {
    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#section/Introduction
     *
     * Returns a digitalocean-specific fetch wrapper for making API calls.
     */
    async callApi<Result = undefined, ResponseJson extends JsonValue = JsonValue>(
      callApiOptions: Parameters<typeof callApi_>[0],
      { parseResultJson = true }: { parseResultJson?: boolean } = {}
    ): Promise<
      Result extends undefined
        ? [result: Response, responseBody: string]
        : [result: Result, responseJson: ResponseJson]
    > {
      const { error: logError } = log.extend('api:do');
      const debug = debug_.extend('api:do:verbose');

      const apiUriBase = await loadFromCliConfig({ configPath, key: 'doApiUriBase' });
      const apiToken = await loadFromCliConfig({ configPath, key: 'doApiToken' });

      assert(
        typeof apiUriBase === 'string',
        ErrorMessage.AssertionFailureInvalidConfig('doApiUriBase')
      );

      assert(
        typeof apiToken === 'string',
        ErrorMessage.AssertionFailureInvalidConfig('doApiToken')
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
        const success = res.ok;
        const { links: _, meta: __, ...result } = responseJson;

        if (!success) {
          debug('response indicates request was unsuccessful');

          let errorMessage = '(request failed but no error message was returned)';
          const { id: code, message } = result;

          if (code || message) {
            errorMessage = `[${code}]: ${message}`;
          }

          logError([LogTag.IF_NOT_SILENCED], errorMessage);
          throw new Error(`terminated due to API error: ${errorMessage}`);
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
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_list
     *
     * @returns A list of DNS zone objects.
     */
    async getDnsZones() {
      const debug = debug_.extend('getDnsZones');
      debug('entered method');

      const domains: Domain[] = [];
      let nextUrl = 'domains?per_page=200' as string | undefined;

      while (nextUrl) {
        const [
          { domains: domains_ },
          responseJson
          // eslint-disable-next-line no-await-in-loop
        ] = await this.callApi<Domains, Partial<Links>>({
          uri: nextUrl,
          method: 'GET'
        });

        domains.push(...domains_);
        nextUrl = responseJson?.links?.pages?.next;

        debug('nextUrl: %O', nextUrl);
      }

      return domains;
    },

    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_list_records
     *
     * Note that `fullRecordName` must be the **FULLY QUALIFIED RECORD NAME** of
     * the record that includes the zone apex itself (e.g. "*.xunn.at" instead
     * of just "*" when trying to retrieve said CNAME record).
     *
     * @return The ID of a DNS record.
     */
    async getDnsRecordId({
      zoneName,
      fullRecordName,
      recordType
    }: {
      zoneName: string;
      fullRecordName: string;
      recordType: string;
    }) {
      const debug = debug_.extend('getDnsRecordId');
      debug('entered method');

      const record = (
        await this.getDnsRecords({
          zoneName,
          targetRecordName: fullRecordName,
          targetRecordType: recordType
        })
      ).at(0);

      const recordId = record?.id;

      debug('selected record.id: %O', recordId);
      return recordId;
    },

    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_list_records
     *
     * Note that `targetRecordName`, if given, must be the **FULLY QUALIFIED
     * RECORD NAME** of the record(s) that includes the zone apex itself (e.g.
     * "*.xunn.at" instead of just "*" when trying to retrieve said CNAME
     * record).
     *
     * @returns A list of DNS record objects.
     */
    async getDnsRecords({
      zoneName,
      targetRecordName,
      targetRecordType
    }: {
      zoneName: string;
      targetRecordName?: string;
      targetRecordType?: string;
    }) {
      const debug = debug_.extend('getDnsZoneRecords');
      debug('entered method');

      const records: ResourceRecord[] = [];

      const additionalQuery = Object.entries({
        name: targetRecordName,
        type: targetRecordType?.toUpperCase()
        // eslint-disable-next-line unicorn/no-array-reduce
      }).reduce(
        (str, [key, value]) => (value !== undefined ? `${str}&${key}=${value}` : str),
        'per_page=200'
      );

      let nextUrl = `domains/${zoneName}/records?${additionalQuery}` as
        | string
        | undefined;

      while (nextUrl) {
        const [
          { domain_records },
          responseJson
          // eslint-disable-next-line no-await-in-loop
        ] = await this.callApi<ResourceRecords, Partial<Links>>({
          uri: nextUrl,
          method: 'GET'
        });

        records.push(...domain_records);
        nextUrl = responseJson?.links?.pages?.next;

        debug('nextUrl: %O', nextUrl);
      }

      return records;
    },

    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_create_record
     */
    async createDnsARecord({
      zoneName,
      subRecordName,
      ipv4,
      ttl
    }: {
      zoneName: string;
      subRecordName: string;
      ipv4: string;
      ttl?: number;
    }): Promise<void> {
      const debug = debug_.extend('createDnsARecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneName,
        recordType: 'A',
        subRecordName: subRecordName,
        data: ipv4,
        ttl
      });
    },

    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_create_record
     */
    async createDnsAaaaRecord({
      subRecordName,
      ipv6: data,
      zoneName,
      ttl
    }: {
      zoneName: string;
      subRecordName: string;
      ipv6: string;
      ttl?: number;
    }): Promise<void> {
      const debug = debug_.extend('createDnsAaaaRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneName,
        recordType: 'AAAA',
        subRecordName: subRecordName,
        data,
        ttl
      });
    },

    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_create_record
     *
     * Creates pre-configured "issue" and "iodef" records.
     */
    async createDnsCaaRecords({ zoneName }: { zoneName: string }): Promise<void> {
      const debug = debug_.extend('createDnsCaaRecords');
      debug('entered method');

      await this.createDnsRecord({
        zoneName,
        recordType: 'CAA',
        subRecordName: '@',
        data: 'letsencrypt.org',
        flags: 128,
        tag: 'issue'
      });

      await this.createDnsRecord({
        zoneName,
        recordType: 'CAA',
        subRecordName: '@',
        data: 'mailto:diagnostics@ergodark.com',
        flags: 128,
        tag: 'iodef'
      });
    },

    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_create_record
     */
    async createDnsCnameRecord({
      subRecordName,
      redirectToHostname,
      zoneName,
      ttl
    }: {
      zoneName: string;
      subRecordName: string;
      redirectToHostname: string;
      ttl?: number;
    }): Promise<void> {
      const debug = debug_.extend('createDnsCnameRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneName,
        recordType: 'CNAME',
        subRecordName: subRecordName,
        data: redirectToHostname,
        ttl
      });
    },

    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_create_record
     */
    async createDnsMxRecord({
      zoneName,
      subRecordName,
      mailHostname,
      ttl
    }: {
      zoneName: string;
      subRecordName: string;
      mailHostname: string;
      ttl?: number;
    }): Promise<void> {
      const debug = debug_.extend('createDnsMxRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneName,
        recordType: 'MX',
        subRecordName: subRecordName,
        data: mailHostname,
        priority: 1,
        ttl
      });
    },

    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_create_record
     */
    async createDnsTxtRecord({
      content,
      subRecordName,
      zoneName,
      ttl
    }: {
      zoneName: string;
      subRecordName: string;
      content: string;
      ttl?: number;
    }): Promise<void> {
      const debug = debug_.extend('createDnsTxtRecord');
      debug('entered method');

      await this.createDnsRecord({
        zoneName,
        recordType: 'TXT',
        subRecordName: subRecordName,
        data: content,
        ttl
      });
    },

    /**
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_create_record
     */
    async createDnsRecord({
      zoneName,
      recordType,
      subRecordName,
      ttl = 1800 /* TTL of 1800 is DO's default */,
      ...additionalOptions
    }: {
      zoneName: string;
      recordType: string;
      subRecordName: string;
      ttl?: number;
      [additionalOption: string]: unknown;
    }): Promise<void> {
      const debug = debug_.extend('createDnsRecord');
      debug('entered method');

      await this.callApi({
        uri: `domains/${zoneName}/records`,
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
     * - https://docs.digitalocean.com/reference/api/api-reference/#operation/domains_delete_record
     *
     * Completely destroys a DNS record.
     */
    async deleteDnsRecord({
      zoneName,
      recordId
    }: {
      zoneName: string;
      recordId: number;
    }): Promise<void> {
      const debug = debug_.extend('deleteDnsRecord');
      debug('entered method');

      await this.callApi(
        {
          uri: `domains/${zoneName}/records/${recordId}`,
          method: 'DELETE'
        },
        { parseResultJson: false }
      );
    }
  };
}

/**
 * Lightweight type guard.
 */
export function isDoResourceRecord(obj: unknown): obj is ResourceRecord {
  return !!obj && typeof obj === 'object' && 'data' in obj;
}
