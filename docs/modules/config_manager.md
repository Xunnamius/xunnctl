[@-xun/ctl](../README.md) / config-manager

# Module: config-manager

## Table of contents

### Type Aliases

- [Config](config_manager.md#config)

### Functions

- [loadFromCliConfig](config_manager.md#loadfromcliconfig)
- [saveToCliConfig](config_manager.md#savetocliconfig)
- [setCache](config_manager.md#setcache)

## Type Aliases

### Config

Ƭ **Config**: `Object`

Available configuration keys and their value types.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `cfAccountId` | `string` | Cloudflare account token. |
| `cfApiToken` | `string` | Cloudflare API token. |
| `cfApiUriBase` | `string` | Cloudflare API base URI. For example: https://api.cloudflare.com/client/v4 |
| `cfFirewallPhaseName` | `string` | Cloudflare firewall phase name. |
| `cfMainZoneId` | `string` | The ID of the primary zone where, for instance, ban lists and email-related configurations are stored. |
| `cfWafBlockHostileIpListName` | `string` | Cloudflare hostile IP blocking list name. |
| `cfWafBlockHostileIpRuleName` | `string` | Cloudflare hostile IP blocking rule name. |
| `doApiToken` | `string` | DigitalOcean API token. |
| `doApiUriBase` | `string` | DigitalOcean API base URI. For example: https://api.digitalocean.com/v2 |

#### Defined in

[src/config-manager.ts:10](https://github.com/Xunnamius/xunnctl/blob/ec3f0bb/src/config-manager.ts#L10)

## Functions

### loadFromCliConfig

▸ **loadFromCliConfig**(`«destructured»`): `Promise`\<`JsonValue`\>

Loads and caches a JSON configuration file and returns a key, if available.
If the key is not available, either a default value or `undefined` is
returned.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `configPath` | `string` |
| › `key` | `LiteralUnion`\<keyof [`Config`](config_manager.md#config), `string`\> |

#### Returns

`Promise`\<`JsonValue`\>

#### Defined in

[src/config-manager.ts:55](https://github.com/Xunnamius/xunnctl/blob/ec3f0bb/src/config-manager.ts#L55)

▸ **loadFromCliConfig**(`«destructured»`): `Promise`\<[`Config`](config_manager.md#config)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `configPath` | `string` |
| › `key?` | `undefined` |

#### Returns

`Promise`\<[`Config`](config_manager.md#config)\>

#### Defined in

[src/config-manager.ts:62](https://github.com/Xunnamius/xunnctl/blob/ec3f0bb/src/config-manager.ts#L62)

___

### saveToCliConfig

▸ **saveToCliConfig**(`«destructured»`): `Promise`\<`void`\>

Accepts a key-value pair, serializes it as JSON, and appends/overwrites the
result into a JSON configuration file while updating the cache.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `configPath` | `string` |
| › `key` | `LiteralUnion`\<keyof [`Config`](config_manager.md#config), `string`\> |
| › `value` | `undefined` \| `JsonValue` |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/config-manager.ts:109](https://github.com/Xunnamius/xunnctl/blob/ec3f0bb/src/config-manager.ts#L109)

___

### setCache

▸ **setCache**(`replacementCache`): `Promise`\<`void`\>

Overwrites the current configuration cache. Useful while testing.

#### Parameters

| Name | Type |
| :------ | :------ |
| `replacementCache` | `undefined` \| [`Config`](config_manager.md#config) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/config-manager.ts:141](https://github.com/Xunnamius/xunnctl/blob/ec3f0bb/src/config-manager.ts#L141)
