import debugFactory from 'debug';

import { ACCOUNT_ID, CF_FIREWALL_PHASE_NAME } from '../env.mjs';
import { makeApiCall } from '../call-api.mjs';

// TODO: replace debug with debug-extended
const debug = debugFactory('ergo-cf:lib:dns:debug');

/**
 * - https://developers.cloudflare.com/api/operations/zones-get
 */
export async function getAllDnsZones() {
  const zones = [];
  let currentPage = 0;
  let countRemaining = 0;

  do {
    const [
      zones_,
      {
        result_info: { count, page, per_page, total_count }
      }
    ] = await makeApiCall(`zones?page=${++currentPage}`, 'GET');

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
 * @param {string} domainName
 * @returns {Promise<string>} zoneId
 */
export async function createDnsZone(domainName) {
  const [{ id: zoneId }] = await makeApiCall('zones', 'POST', {
    account: { id: ACCOUNT_ID },
    name: domainName,
    type: 'full'
  });

  await reinitializeDnsZone(zoneId);
  return zoneId;
}

/**
 * - https://developers.cloudflare.com/api/operations/zones-get
 *
 * @param {string} domainName
 * @returns {Promise<string | null>} `zoneId` or `null` if not found
 */
export async function getDnsZoneId(domainName) {
  const zoneId = await makeApiCall(`zones?name=${domainName}`, 'GET').then(([zones]) => {
    debug('searching for %O', domainName);

    const zone = zones.find(({ name }) => {
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
 * @param {string} zoneId
 * @returns {Promise<void>}
 */
export async function reinitializeDnsZone(zoneId) {
  await makeApiCall(`zones/${zoneId}/settings`, 'PATCH', {
    items: [
      { id: 'always_use_https', value: 'on' },
      { id: 'ipv6', value: 'on' },
      { id: 'ssl', value: 'strict' },
      { id: 'min_tls_version', value: '1.2' }
    ]
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 *
 * @param {string} zoneId
 * @param {string} domainName DNS record name (or @ for the zone apex) in Punycode.
 * @param {string} ipv4 A valid IPv4 address.
 * @param {boolean} [proxied=false] Whether the record is receiving the performance and security benefits of Cloudflare.
 */
export async function createDnsARecord(zoneId, domainName, ipv4, proxied = false) {
  await createDnsRecord(zoneId, 'A', domainName, { content: ipv4, proxied });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 *
 * @param {string} zoneId
 * @param {string} domainName DNS record name (or @ for the zone apex) in Punycode.
 * @param {string} ipv6 A valid IPv6 address.
 * @param {boolean} [proxied=false] Whether the record is receiving the performance and security benefits of Cloudflare.
 */
export async function createDnsAaaaRecord(zoneId, domainName, ipv6, proxied = false) {
  await createDnsRecord(zoneId, 'AAAA', domainName, { content: ipv6, proxied });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 *
 * Creates pre-configured "issue" and "iodef" records.
 *
 * @param {string} zoneId
 */
export async function createDnsCaaRecords(zoneId) {
  await createDnsRecord(zoneId, 'CAA', '@', {
    data: {
      flags: 128,
      tag: 'issue',
      value: 'letsencrypt.org'
    }
  });

  await createDnsRecord(zoneId, 'CAA', '@', {
    data: {
      flags: 128,
      tag: 'iodef',
      value: 'mailto:diagnostics@ergodark.com'
    }
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 *
 * @param {string} zoneId
 * @param {string} domainName DNS record name (or @ for the zone apex) in Punycode.
 * @param {string} redirectToHostname A valid hostname. Must not match the record's name.
 * @param {boolean} [proxied=false] Whether the record is receiving the performance and security benefits of Cloudflare.
 */
export async function createDnsCnameRecord(
  zoneId,
  domainName,
  redirectToHostname,
  proxied = false
) {
  await createDnsRecord(zoneId, 'CNAME', domainName, {
    content: redirectToHostname,
    proxied
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 *
 * @param {string} zoneId
 * @param {string} domainName DNS record name (or @ for the zone apex) in Punycode.
 * @param {string} mailHostname A valid mail server hostname.
 */
export async function createDnsMxRecord(zoneId, domainName, mailHostname) {
  await createDnsRecord(zoneId, 'MX', domainName, {
    content: mailHostname,
    priority: 1
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 *
 * @param {string} zoneId
 * @param {string} domainName DNS record name (or @ for the zone apex) in Punycode.
 * @param {string} content Text content for the record.
 */
export async function createDnsTxtRecord(zoneId, domainName, content) {
  await createDnsRecord(zoneId, 'TXT', domainName, { content });
}

/**
 * - https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-create-dns-record
 *
 * @param {string} zoneId
 * @param {string} type Record type.
 * @param {string} domainName DNS record name (or @ for the zone apex) in Punycode.
 * @param {Record<string, unknown>} [additionalOptions]
 */
export async function createDnsRecord(zoneId, type, domainName, additionalOptions) {
  await makeApiCall(`zones/${zoneId}/dns_records`, 'POST', {
    name: domainName,
    type,
    ttl: 1,
    ...additionalOptions
  });
}

/**
 * - https://developers.cloudflare.com/api/operations/cloudflare-i-ps-cloudflare-ip-details
 */
export async function getCloudflareIps() {
  const [{ ipv4_cidrs: ipv4, ipv6_cidrs: ipv6 }] = await makeApiCall('ips', 'GET');

  return { ipv4, ipv6 };
}

/**
 * - https://developers.cloudflare.com/api/operations/createZoneRuleset
 *
 * Note that the custom firewall ruleset is created if it does not already
 * exist. If it already exists, it will simply be returned instead.
 *
 * @param {string} zoneId
 * @returns {Promise<string>} rulesetId
 */
export async function getDnsZoneCustomFirewallRulesetId(zoneId) {
  const rulesetId = await getDnsZoneCustomFirewallRuleset(zoneId).then(
    async (ruleset) => {
      if (ruleset?.id) {
        debug('using existing custom firewall ruleset: %O', ruleset.id);
        return ruleset.id;
      } else {
        debug('creating new custom firewall ruleset...');

        const [newRuleset] = await makeApiCall(`zones/${zoneId}/rulesets`, 'POST', {
          description: '',
          kind: 'zone',
          name: 'default',
          phase: CF_FIREWALL_PHASE_NAME,
          rules: []
        });

        debug('new ruleset: %O', newRuleset);
        return newRuleset.id;
      }
    }
  );

  return rulesetId;
}

/**
 * - https://developers.cloudflare.com/api/operations/listZoneRulesets
 *
 * @param {string} zoneId
 * @returns {Promise<Record<string, unknown> | undefined>} the zone's custom firewall
 * ruleset or `undefined` if it does not exist
 */
export async function getDnsZoneCustomFirewallRuleset(zoneId) {
  debug('searching for %O', CF_FIREWALL_PHASE_NAME);

  const ruleset = (await getDnsZoneRulesets(zoneId)).find((ruleset) => {
    debug('saw ruleset phase %O', ruleset.phase);
    return ruleset.phase === CF_FIREWALL_PHASE_NAME;
  });

  debug('selected ruleset: %O', ruleset);
  debug('selected ruleset.id: %O', ruleset?.id);

  return ruleset;
}

/**
 * - https://developers.cloudflare.com/api/operations/listZoneRulesets
 *
 * @param {string} zoneId
 * @returns {Promise<Record<string, unknown>[]>} list of the zone's rulesets
 */
export async function getDnsZoneRulesets(zoneId) {
  const [rulesets] = await makeApiCall(`zones/${zoneId}/rulesets`, 'GET');
  return rulesets;
}

/**
 * - https://developers.cloudflare.com/api/operations/createZoneRulesetRule
 *
 * This function will not allow rules with duplicate descriptions by default.
 * This can be overridden by providing `{ allowDuplicate: true }` via
 * `additionalOptions`.
 *
 * @param {string} zoneId
 * @param {string} action
 * @param {string} expression
 * @param {string} description
 * @param {Record<string, unknown>} [additionalOptions]
 */
export async function createDnsZoneCustomFirewallRulesetRule(
  zoneId,
  action,
  expression,
  description,
  additionalOptions
) {
  const rulesetRuleId = await getDnsZoneCustomFirewallRulesetId(zoneId)
    .then(async (rulesetId) => {
      if (!additionalOptions?.allowDuplicates) {
        const existingRules = await getDnsZoneRulesetRules(zoneId, rulesetId);
        const matchesDescription = (rule) => {
          debug(
            `error check: rule.description === description ("${rule.description}" === "${description}")`
          );

          return rule.description === description;
        };

        if (existingRules.some(matchesDescription)) {
          throw new Error(
            `cannot create dns zone custom firewall ruleset rule with duplicate description "${description}"`
          );
        }
      }

      return createDnsZoneRulesetRule(
        zoneId,
        rulesetId,
        action,
        expression,
        description,
        additionalOptions
      );
    })
    .then(({ id }) => id);

  return rulesetRuleId;
}

/**
 * - https://developers.cloudflare.com/api/operations/getZoneRuleset
 *
 * @param {string} zoneId
 * @returns {Promise<Record<string, unknown>[]>} list of the ruleset's rules
 */
export async function getDnsZoneCustomFirewallRulesetRules(zoneId) {
  const rules = await getDnsZoneCustomFirewallRulesetId(zoneId).then((rulesetId) => {
    return getDnsZoneRulesetRules(zoneId, rulesetId);
  });

  return rules;
}

/**
 * - https://developers.cloudflare.com/api/operations/createZoneRulesetRule
 *
 * Note that,
 *
 * @param {string} zoneId
 * @param {string} rulesetId
 * @param {string} action
 * @param {string} expression
 * @param {string} description
 * @param {Record<string, unknown>} [additionalOptions]
 */
export async function createDnsZoneRulesetRule(
  zoneId,
  rulesetId,
  action,
  expression,
  description,
  additionalOptions
) {
  const [{ id: rulesetRuleId }] = await makeApiCall(
    `zones/${zoneId}/rulesets/${rulesetId}/rules`,
    'POST',
    {
      action,
      expression,
      description,
      enabled: true,
      ...additionalOptions
    }
  );

  return rulesetRuleId;
}

/**
 * - https://developers.cloudflare.com/api/operations/getZoneRuleset
 *
 * @param {string} zoneId
 * @param {string} rulesetId
 * @returns {Promise<Record<string, unknown>[]>} list of the ruleset's rules
 */
export async function getDnsZoneRulesetRules(zoneId, rulesetId) {
  const [{ rules }] = await makeApiCall(`zones/${zoneId}/rulesets/${rulesetId}`, 'GET');

  return rules || [];
}
