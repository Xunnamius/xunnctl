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
export type Zone = WithId<{ name: string }>;

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
