import { makeCloudflareApiCall } from 'universe/api/cloudflare';

import type { ExtendedDebugger } from 'multiverse/debug-extended';
import { ExtendedLogger } from 'multiverse/rejoinder';

/**
 * @internal
 */
export type RulesetRule = { id: string; description: string; phase: string };

/**
 * @internal
 */
type Zone = { id: string; name: string };

/**
 * - https://developers.cloudflare.com/api/operations/zones-get
 *
 * @returns A list of DNS zone objects.
 */
export async function getAllDnsZones({
  debug: debug_,
  log,
  configPath
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
}): Promise<Zone[]> {
  const debug = debug_.extend('getAllDnsZones');

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
    ] = await makeCloudflareApiCall({
      debug,
      log,
      configPath,
      uri: `zones?page=${++currentPage}`,
      method: 'GET'
    });

    zones.push(...zones_);
    countRemaining = total_count - (count + (page - 1) * per_page);

    debug('(getAllDnsZones) zones.length: %O', zones.length);
    debug('(getAllDnsZones) countRemaining: %O', countRemaining);
  } while (countRemaining > 0);

  return zones;
}

/**
 * - https://developers.cloudflare.com/api/operations/zones-post
 * - https://developers.cloudflare.com/api/operations/zone-settings-edit-zone-settings-info
 *
 * @return The ID of the newly created DNS zone.
 */
export async function createDnsZone({
  debug: debug_,
  log,
  configPath,
  domainName,
  accountId
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  domainName: string;
  accountId: string;
}): Promise<string> {
  const debug = debug_.extend('createDnsZone');

  const [{ id: zoneId }] = await makeCloudflareApiCall({
    debug,
    log,
    configPath,
    uri: 'zones',
    method: 'POST',
    body: {
      account: { id: accountId },
      name: domainName,
      type: 'full'
    }
  });

  await reinitializeDnsZone(zoneId);
  return zoneId;
}

/**
 * - https://developers.cloudflare.com/api/operations/zones-get
 *
 * @return The ID of the DNS zone.
 */
export async function getDnsZoneId({
  debug: debug_,
  log,
  configPath,
  domainName
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  domainName: string;
}): Promise<string | undefined> {
  const debug = debug_.extend('getDnsZoneId');

  const zoneId = await makeCloudflareApiCall({
    debug,
    log,
    configPath,
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
}

/**
 * - https://developers.cloudflare.com/api/operations/zones-patch
 *
 * Updates/overwrites the settings of the specified zone.
 */
export async function reinitializeDnsZone({
  debug: debug_,
  log,
  configPath,
  zoneId
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
}): Promise<void> {
  const debug = debug_.extend('reinitializeDnsZone');

  await makeCloudflareApiCall({
    debug,
    log,
    configPath,
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
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 */
export async function createDnsARecord({
  debug: debug_,
  log,
  configPath,
  zoneId,
  domainName,
  ipv4,
  proxied = false
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  domainName: string;
  ipv4: string;
  proxied: boolean;
}): Promise<void> {
  const debug = debug_.extend('createDnsARecord');

  await createDnsRecord({
    debug,
    log,
    configPath,
    zoneId,
    type: 'A',
    domainName,
    content: ipv4,
    proxied
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 */
export async function createDnsAaaaRecord({
  debug: debug_,
  log,
  configPath,
  domainName,
  ipv6: content,
  zoneId,
  proxied = false
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  domainName: string;
  ipv6: string;
  proxied: boolean;
}): Promise<void> {
  const debug = debug_.extend('createDnsAaaaRecord');

  await createDnsRecord({
    debug,
    log,
    configPath,
    zoneId,
    type: 'AAAA',
    domainName,
    content,
    proxied
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 *
 * Creates pre-configured "issue" and "iodef" records.
 */
export async function createDnsCaaRecords({
  debug: debug_,
  log,
  configPath,
  zoneId
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
}): Promise<void> {
  const debug = debug_.extend('createDnsCaaRecords');

  await createDnsRecord({
    debug,
    log,
    configPath,
    zoneId,
    type: 'CAA',
    domainName: '@',
    data: {
      flags: 128,
      tag: 'issue',
      value: 'letsencrypt.org'
    }
  });

  await createDnsRecord({
    debug,
    log,
    configPath,
    zoneId,
    type: 'CAA',
    domainName: '@',
    data: {
      flags: 128,
      tag: 'iodef',
      value: 'mailto:diagnostics@ergodark.com'
    }
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 */
export async function createDnsCnameRecord({
  debug: debug_,
  log,
  configPath,
  domainName,
  redirectToHostname,
  zoneId,
  proxied = false
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  domainName: string;
  redirectToHostname: string;
  proxied: boolean;
}): Promise<void> {
  const debug = debug_.extend('createDnsCnameRecord');

  await createDnsRecord({
    debug,
    log,
    configPath,
    zoneId,
    type: 'CNAME',
    domainName,
    content: redirectToHostname,
    proxied
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 */
export async function createDnsMxRecord({
  debug: debug_,
  log,
  configPath,
  zoneId,
  domainName,
  mailHostname
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  domainName: string;
  mailHostname: string;
}): Promise<void> {
  const debug = debug_.extend('createDnsMxRecord');

  await createDnsRecord({
    debug,
    log,
    configPath,
    zoneId,
    type: 'MX',
    domainName,
    content: mailHostname,
    priority: 1
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 */
export async function createDnsTxtRecord({
  debug: debug_,
  log,
  configPath,
  content,
  domainName,
  zoneId
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  domainName: string;
  content: string;
}): Promise<void> {
  const debug = debug_.extend('createDnsTxtRecord');

  await createDnsRecord({
    debug,
    log,
    configPath,
    zoneId,
    type: 'TXT',
    domainName,
    content
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 */
export async function createDnsRecord({
  debug: debug_,
  log,
  configPath,
  zoneId,
  type,
  domainName,
  ...additionalOptions
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  type: string;
  domainName: string;
  [additionalOption: string]: unknown;
}): Promise<void> {
  const debug = debug_.extend('createDnsRecord');

  await makeCloudflareApiCall({
    debug,
    log,
    configPath,
    uri: `zones/${zoneId}/dns_records`,
    method: 'POST',
    body: {
      name: domainName,
      type,
      ttl: 1,
      ...additionalOptions
    }
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/cloudflare-i-ps-cloudflare-ip-details
 *
 * @returns An object containing Cloudflare's public IPv4 and IPv6 addresses.
 */
export async function getCloudflareIps({
  debug: debug_,
  log,
  configPath
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
}): Promise<{ ipv4: string[]; ipv6: string[] }> {
  const debug = debug_.extend('getCloudflareIps');

  const [{ ipv4_cidrs: ipv4, ipv6_cidrs: ipv6 }] = await makeCloudflareApiCall({
    debug,
    log,
    configPath,
    uri: 'ips',
    method: 'GET'
  });

  return { ipv4, ipv6 };
}

/**
 * https://developers.cloudflare.com/api/operations/createZoneRuleset
 *
 * Gets (or creates if it does not already exist) a custom firewall ruleset and
 * returns its ID. Note that the ruleset is created if it does not already exist.
 * If it already exists, it will simply be returned instead.
 *
 * @returns The ID of the ruleset.
 */
export async function getDnsZoneCustomFirewallRulesetId({
  debug: debug_,
  log,
  configPath,
  zoneId,
  phaseName
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  phaseName: string;
}): Promise<string> {
  const debug = debug_.extend('getDnsZoneCustomFirewallRulesetId');

  const rulesetId = await getDnsZoneCustomFirewallRuleset({
    debug,
    log,
    configPath,
    zoneId,
    phaseName
  }).then(async (ruleset) => {
    if (ruleset?.id) {
      debug('using existing custom firewall ruleset: %O', ruleset.id);
      return ruleset.id;
    } else {
      debug('creating new custom firewall ruleset...');

      const [createdRuleset] = await makeCloudflareApiCall({
        debug,
        log,
        configPath,
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
}

/**
 * - https://developers.cloudflare.com/api/operations/listZoneRulesets
 *
 * @returns The zone's custom firewall ruleset or `undefined` if it does not
 * exist.
 */
export async function getDnsZoneCustomFirewallRuleset({
  debug: debug_,
  log,
  configPath,
  zoneId,
  phaseName
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  phaseName: string;
}): Promise<RulesetRule | undefined> {
  const debug = debug_.extend('getDnsZoneCustomFirewallRuleset');

  debug('searching for %O', phaseName);

  const ruleset = (await getDnsZoneRulesets({ debug, log, configPath, zoneId })).find(
    (ruleset) => {
      debug('saw ruleset phase %O', ruleset.phase);
      return ruleset.phase === phaseName;
    }
  );

  debug('selected ruleset: %O', ruleset);
  debug('selected ruleset.id: %O', ruleset?.id);

  return ruleset;
}

/**
 * - https://developers.cloudflare.com/api/operations/listZoneRulesets
 *
 * @returns A list of the zone's rulesets.
 */
export async function getDnsZoneRulesets({
  debug: debug_,
  log,
  configPath,
  zoneId
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
}): Promise<RulesetRule[]> {
  const debug = debug_.extend('getDnsZoneRulesets');

  const [rulesets] = await makeCloudflareApiCall({
    debug,
    log,
    configPath,
    uri: `zones/${zoneId}/rulesets`,
    method: 'GET'
  });
  return rulesets;
}

/**
 * - https://developers.cloudflare.com/api/operations/createZoneRulesetRule
 *
 * This function will not allow rules with duplicate descriptions by default.
 * This can be overridden by providing `{ allowDuplicate: true }`.
 *
 * @return The newly created ruleset rule's ID.
 */
export async function createDnsZoneCustomFirewallRulesetRule({
  debug: debug_,
  log,
  configPath,
  zoneId,
  action,
  expression,
  description,
  allowDuplicate,
  phaseName,
  ...additionalOptions
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  action: string;
  expression: string;
  description: string;
  allowDuplicate?: boolean;
  phaseName: string;
  [additionalOption: string]: unknown;
}): Promise<string> {
  const debug = debug_.extend('createDnsZoneCustomFirewallRulesetRule');

  const rulesetRuleId = await getDnsZoneCustomFirewallRulesetId({
    debug,
    log,
    configPath,
    zoneId,
    phaseName
  }).then(async (rulesetId) => {
    if (!allowDuplicate) {
      const existingRules = await getDnsZoneRulesetRules({
        debug,
        log,
        configPath,
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

    return createDnsZoneRulesetRule({
      debug,
      log,
      configPath,
      zoneId,
      rulesetId,
      action,
      expression,
      description,
      ...additionalOptions
    });
  });

  return rulesetRuleId;
}

/**
 * - https://developers.cloudflare.com/api/operations/getZoneRuleset
 *
 * @returns A list of ruleset rules.
 */
export async function getDnsZoneCustomFirewallRulesetRules({
  debug: debug_,
  log,
  configPath,
  zoneId,
  phaseName
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  phaseName: string;
}): Promise<RulesetRule[]> {
  const debug = debug_.extend('getDnsZoneCustomFirewallRulesetRules');

  const rules = await getDnsZoneCustomFirewallRulesetId({
    debug,
    log,
    configPath,
    zoneId,
    phaseName
  }).then((rulesetId) => {
    return getDnsZoneRulesetRules({ debug, log, configPath, zoneId, rulesetId });
  });

  return rules;
}

/**
 * - https://developers.cloudflare.com/api/operations/createZoneRulesetRule
 *
 * @return The newly created ruleset rule's ID.
 */
export async function createDnsZoneRulesetRule({
  debug: debug_,
  log,
  configPath,
  zoneId,
  rulesetId,
  action,
  expression,
  description,
  ...additionalOptions
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  rulesetId: string;
  action: string;
  expression: string;
  description: string;
  [additionalOption: string]: unknown;
}): Promise<string> {
  const debug = debug_.extend('createDnsZoneRulesetRule');

  const [{ id: rulesetRuleId }] = await makeCloudflareApiCall({
    debug,
    log,
    configPath,
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
}

/**
 * - https://developers.cloudflare.com/api/operations/getZoneRuleset
 *
 * @returns A list of ruleset rules.
 */
export async function getDnsZoneRulesetRules({
  debug: debug_,
  log,
  configPath,
  rulesetId,
  zoneId
}: {
  debug: ExtendedDebugger;
  log: ExtendedLogger;
  configPath: string;
  zoneId: string;
  rulesetId: string;
}): Promise<RulesetRule[]> {
  const debug = debug_.extend('getDnsZoneRulesetRules');

  const [{ rules }] = await makeCloudflareApiCall({
    debug,
    log,
    configPath,
    uri: `zones/${zoneId}/rulesets/${rulesetId}`,
    method: 'GET'
  });
  return rules || [];
}
