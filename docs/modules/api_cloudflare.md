[@-xun/ctl](../README.md) / api/cloudflare

# Module: api/cloudflare

## Table of contents

### Type Aliases

- [ResourceRecord](api_cloudflare.md#resourcerecord)
- [Ruleset](api_cloudflare.md#ruleset)
- [RulesetRule](api_cloudflare.md#rulesetrule)
- [Rulesets](api_cloudflare.md#rulesets)
- [WithId](api_cloudflare.md#withid)
- [Zone](api_cloudflare.md#zone)

### Functions

- [makeCloudflareApiCaller](api_cloudflare.md#makecloudflareapicaller)

## Type Aliases

### ResourceRecord

Ƭ **ResourceRecord**: `Object`

https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records

#### Type declaration

| Name | Type |
| :------ | :------ |
| `comment?` | `string` |
| `content` | `string` |
| `created_on` | `string` |
| `id` | `string` |
| `locked` | `boolean` |
| `modified_on` | `string` |
| `name` | `string` |
| `proxiable` | `string` |
| `proxied?` | `boolean` |
| `tags?` | `string`[] |
| `ttl?` | `number` |
| `type` | `string` |
| `zone_id?` | `string` |
| `zone_name` | `string` |

#### Defined in

[src/api/cloudflare/types.ts:63](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/api/cloudflare/types.ts#L63)

___

### Ruleset

Ƭ **Ruleset**: [`WithId`](api_cloudflare.md#withid)\<\{ `description`: `string` ; `name`: `string` ; `phase`: `string` ; `rules`: [`RulesetRule`](api_cloudflare.md#rulesetrule)[]  }\>

https://developers.cloudflare.com/api/operations/getZoneRuleset

#### Defined in

[src/api/cloudflare/types.ts:14](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/api/cloudflare/types.ts#L14)

___

### RulesetRule

Ƭ **RulesetRule**: [`WithId`](api_cloudflare.md#withid)\<\{ `description`: `string`  }\>

https://developers.cloudflare.com/api/operations/getZoneRuleset

#### Defined in

[src/api/cloudflare/types.ts:24](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/api/cloudflare/types.ts#L24)

___

### Rulesets

Ƭ **Rulesets**: `Omit`\<[`Ruleset`](api_cloudflare.md#ruleset), ``"rules"``\>[]

https://developers.cloudflare.com/api/operations/listZoneRulesets

#### Defined in

[src/api/cloudflare/types.ts:9](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/api/cloudflare/types.ts#L9)

___

### WithId

Ƭ **WithId**\<`T`\>: \{ `id`: `string`  } & `T`

`T` has an ID property.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `unknown` |

#### Defined in

[src/api/cloudflare/types.ts:4](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/api/cloudflare/types.ts#L4)

___

### Zone

Ƭ **Zone**: [`WithId`](api_cloudflare.md#withid)\<\{ `account`: \{ `id`: `string` ; `name`: `string`  } ; `activated_on`: `string` ; `created_on`: `string` ; `development_mode`: `number` ; `id`: `string` ; `meta`: \{ `cdn_only`: ``true`` ; `custom_certificate_quota`: `number` ; `dns_only`: ``true`` ; `foundation_dns`: ``true`` ; `page_rule_quota`: `number` ; `phishing_detected`: ``false`` ; `step`: `number`  } ; `modified_on`: `string` ; `name`: `string` ; `original_dnshost`: `string` ; `original_name_servers`: `string`[] ; `original_registrar`: `string` ; `owner`: \{ `id`: `string` ; `name`: `string` ; `type`: `string`  } ; `vanity_name_servers`: `string`[]  }\>

https://developers.cloudflare.com/api/operations/zones-get

#### Defined in

[src/api/cloudflare/types.ts:29](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/api/cloudflare/types.ts#L29)

## Functions

### makeCloudflareApiCaller

▸ **makeCloudflareApiCaller**(`«destructured»`): `Promise`\<\{ `callApi`: \<Result, ResponseJson\>(`callApiOptions`: \{ `body?`: `JsonValue` ; `uri`: `string`  } & `Omit`\<`RequestInit`, ``"body"``\> & \{ `[additionalOption: string]`: `unknown`;  }, `__namedParameters`: \{ `parseResultJson?`: `boolean` = true }) => `Promise`\<`Result` extends `undefined` ? [result: Response, responseBody: string] : [result: Result, responseJson: ResponseJson]\> ; `createDnsARecord`: (`__namedParameters`: \{ `domainName`: `string` ; `ipv4`: `string` ; `proxied`: `boolean` = false; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsAaaaRecord`: (`__namedParameters`: \{ `domainName`: `string` ; `ipv6`: `string` ; `proxied`: `boolean` = false; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsCaaRecords`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsCnameRecord`: (`__namedParameters`: \{ `domainName`: `string` ; `proxied`: `boolean` = false; `redirectToHostname`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsMxRecord`: (`__namedParameters`: \{ `domainName`: `string` ; `mailHostname`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsRecord`: (`__namedParameters`: \{ `[additionalOption: string]`: `unknown`; `domainName`: `string` ; `type`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsTxtRecord`: (`__namedParameters`: \{ `content`: `string` ; `domainName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsZone`: (`__namedParameters`: \{ `accountId`: `string` ; `domainName`: `string`  }) => `Promise`\<`string`\> ; `createDnsZoneCustomFirewallRulesetRule`: (`__namedParameters`: \{ `[additionalOption: string]`: `unknown`; `allowDuplicate?`: `boolean` ; `ruleAction`: `string` ; `ruleDescription`: `string` ; `ruleExpression`: `string` ; `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`string`\> ; `createDnsZoneRulesetRule`: (`__namedParameters`: \{ `[additionalOption: string]`: `unknown`; `action`: `string` ; `description`: `string` ; `expression`: `string` ; `rulesetId`: `string` ; `zoneId`: `string`  }) => `Promise`\<`string`\> ; `deleteDnsRecord`: (`__namedParameters`: \{ `recordId`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `deleteDnsZone`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`void`\> ; `deleteDnsZoneCustomFirewallRuleset`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `getCloudflareIps`: () => `Promise`\<\{ `ipv4`: `string`[] ; `ipv6`: `string`[]  }\> ; `getDnsRecord`: (`__namedParameters`: \{ `fullDomainName`: `string` ; `type`: `string` ; `zoneId`: `string`  }) => `Promise`\<`undefined` \| [`ResourceRecord`](api_cloudflare.md#resourcerecord)\> ; `getDnsRecordId`: (`__namedParameters`: \{ `fullDomainName`: `string` ; `type`: `string` ; `zoneId`: `string`  }) => `Promise`\<`undefined` \| `string`\> ; `getDnsRecords`: (`__namedParameters`: \{ `recordName?`: `string` ; `recordType?`: `string` ; `zoneId`: `string`  }) => `Promise`\<[`ResourceRecord`](api_cloudflare.md#resourcerecord)[]\> ; `getDnsZone`: (`__namedParameters`: \{ `domainName`: `string`  }) => `Promise`\<`undefined` \| [`Zone`](api_cloudflare.md#zone)\> ; `getDnsZoneCustomFirewallRuleset`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`undefined` \| [`Ruleset`](api_cloudflare.md#ruleset)\> ; `getDnsZoneCustomFirewallRulesetId`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`string`\> ; `getDnsZoneCustomFirewallRulesetRules`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<[`RulesetRule`](api_cloudflare.md#rulesetrule)[]\> ; `getDnsZoneId`: (`__namedParameters`: \{ `domainName`: `string`  }) => `Promise`\<`undefined` \| `string`\> ; `getDnsZoneRulesetRules`: (`__namedParameters`: \{ `rulesetId`: `string` ; `zoneId`: `string`  }) => `Promise`\<[`RulesetRule`](api_cloudflare.md#rulesetrule)[]\> ; `getDnsZoneRulesets`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<[`Ruleset`](api_cloudflare.md#ruleset)[]\> ; `getDnsZones`: () => `Promise`\<[`Zone`](api_cloudflare.md#zone)[]\> ; `reinitializeDnsZone`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`void`\>  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | \{ `configPath`: `string` ; `log`: `ExtendedLogger`  } & \{ `debug`: `ExtendedDebugger`  } |

#### Returns

`Promise`\<\{ `callApi`: \<Result, ResponseJson\>(`callApiOptions`: \{ `body?`: `JsonValue` ; `uri`: `string`  } & `Omit`\<`RequestInit`, ``"body"``\> & \{ `[additionalOption: string]`: `unknown`;  }, `__namedParameters`: \{ `parseResultJson?`: `boolean` = true }) => `Promise`\<`Result` extends `undefined` ? [result: Response, responseBody: string] : [result: Result, responseJson: ResponseJson]\> ; `createDnsARecord`: (`__namedParameters`: \{ `domainName`: `string` ; `ipv4`: `string` ; `proxied`: `boolean` = false; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsAaaaRecord`: (`__namedParameters`: \{ `domainName`: `string` ; `ipv6`: `string` ; `proxied`: `boolean` = false; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsCaaRecords`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsCnameRecord`: (`__namedParameters`: \{ `domainName`: `string` ; `proxied`: `boolean` = false; `redirectToHostname`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsMxRecord`: (`__namedParameters`: \{ `domainName`: `string` ; `mailHostname`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsRecord`: (`__namedParameters`: \{ `[additionalOption: string]`: `unknown`; `domainName`: `string` ; `type`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsTxtRecord`: (`__namedParameters`: \{ `content`: `string` ; `domainName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsZone`: (`__namedParameters`: \{ `accountId`: `string` ; `domainName`: `string`  }) => `Promise`\<`string`\> ; `createDnsZoneCustomFirewallRulesetRule`: (`__namedParameters`: \{ `[additionalOption: string]`: `unknown`; `allowDuplicate?`: `boolean` ; `ruleAction`: `string` ; `ruleDescription`: `string` ; `ruleExpression`: `string` ; `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`string`\> ; `createDnsZoneRulesetRule`: (`__namedParameters`: \{ `[additionalOption: string]`: `unknown`; `action`: `string` ; `description`: `string` ; `expression`: `string` ; `rulesetId`: `string` ; `zoneId`: `string`  }) => `Promise`\<`string`\> ; `deleteDnsRecord`: (`__namedParameters`: \{ `recordId`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `deleteDnsZone`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`void`\> ; `deleteDnsZoneCustomFirewallRuleset`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `getCloudflareIps`: () => `Promise`\<\{ `ipv4`: `string`[] ; `ipv6`: `string`[]  }\> ; `getDnsRecord`: (`__namedParameters`: \{ `fullDomainName`: `string` ; `type`: `string` ; `zoneId`: `string`  }) => `Promise`\<`undefined` \| [`ResourceRecord`](api_cloudflare.md#resourcerecord)\> ; `getDnsRecordId`: (`__namedParameters`: \{ `fullDomainName`: `string` ; `type`: `string` ; `zoneId`: `string`  }) => `Promise`\<`undefined` \| `string`\> ; `getDnsRecords`: (`__namedParameters`: \{ `recordName?`: `string` ; `recordType?`: `string` ; `zoneId`: `string`  }) => `Promise`\<[`ResourceRecord`](api_cloudflare.md#resourcerecord)[]\> ; `getDnsZone`: (`__namedParameters`: \{ `domainName`: `string`  }) => `Promise`\<`undefined` \| [`Zone`](api_cloudflare.md#zone)\> ; `getDnsZoneCustomFirewallRuleset`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`undefined` \| [`Ruleset`](api_cloudflare.md#ruleset)\> ; `getDnsZoneCustomFirewallRulesetId`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`string`\> ; `getDnsZoneCustomFirewallRulesetRules`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<[`RulesetRule`](api_cloudflare.md#rulesetrule)[]\> ; `getDnsZoneId`: (`__namedParameters`: \{ `domainName`: `string`  }) => `Promise`\<`undefined` \| `string`\> ; `getDnsZoneRulesetRules`: (`__namedParameters`: \{ `rulesetId`: `string` ; `zoneId`: `string`  }) => `Promise`\<[`RulesetRule`](api_cloudflare.md#rulesetrule)[]\> ; `getDnsZoneRulesets`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<[`Ruleset`](api_cloudflare.md#ruleset)[]\> ; `getDnsZones`: () => `Promise`\<[`Zone`](api_cloudflare.md#zone)[]\> ; `reinitializeDnsZone`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`void`\>  }\>

#### Defined in

[src/api/cloudflare/index.ts:14](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/api/cloudflare/index.ts#L14)
