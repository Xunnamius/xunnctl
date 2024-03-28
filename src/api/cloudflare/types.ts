/**
 * `T` has an ID property.
 */
export type WithId<T = unknown> = { id: string } & T;

/**
 * https://developers.cloudflare.com/api/operations/listZoneRulesets
 */
export type Rulesets = Omit<Ruleset, 'rules'>[];

/**
 * https://developers.cloudflare.com/api/operations/getZoneRuleset
 */
export type Ruleset = WithId<{
  name: string;
  description: string;
  rules: RulesetRule[];
  phase: string;
}>;

/**
 * https://developers.cloudflare.com/api/operations/getZoneRuleset
 */
export type RulesetRule = WithId<{ description: string }>;

/**
 * https://developers.cloudflare.com/api/operations/zones-get
 */
export type Zone = WithId<{
  account: {
    id: string;
    name: string;
  };
  activated_on: string;
  created_on: string;
  development_mode: number;
  id: string;
  meta: {
    cdn_only: true;
    custom_certificate_quota: number;
    dns_only: true;
    foundation_dns: true;
    page_rule_quota: number;
    phishing_detected: false;
    step: number;
  };
  modified_on: string;
  name: string;
  original_dnshost: string;
  original_name_servers: string[];
  original_registrar: string;
  owner: {
    id: string;
    name: string;
    type: string;
  };
  vanity_name_servers: string[];
}>;

/**
 * https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records
 */
export type ResourceRecord = {
  content: string;
  name: string;
  proxied?: boolean;
  type: string;
  comment?: string;
  created_on: string;
  id: string;
  locked: boolean;
  modified_on: string;
  proxiable: string;
  tags?: string[];
  ttl?: number;
  zone_id?: string;
  zone_name: string;
};

export type HostileIp = {
  comment: string;
  created_on: string;
  id: string;
  ip: string;
  modified_on: string;
};

export type Metadata = {
  result_info?: {
    count?: number;
    page?: number;
    per_page?: number;
    total_count?: number;
    cursors?: { after?: string };
  };
};
