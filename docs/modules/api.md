[@-xun/ctl](../README.md) / api

# Module: api

## Table of contents

### Functions

- [makeApiCallerBase](api.md#makeapicallerbase)

## Functions

### makeApiCallerBase

▸ **makeApiCallerBase**(`«destructured»`): (`__namedParameters`: \{ `body?`: `JsonValue` ; `uri`: `string`  } & `Omit`\<`RequestInit`, ``"body"``\> & \{ `[additionalOption: string]`: `unknown`;  }) => `Promise`\<[response: Response, responseBody: string]\>

Returns a generic fetch wrapper for making API calls.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `debug` | `ExtendedDebugger` |

#### Returns

`fn`

▸ (`«destructured»`): `Promise`\<[response: Response, responseBody: string]\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | \{ `body?`: `JsonValue` ; `uri`: `string`  } & `Omit`\<`RequestInit`, ``"body"``\> & \{ `[additionalOption: string]`: `unknown`;  } |

##### Returns

`Promise`\<[response: Response, responseBody: string]\>

#### Defined in

[src/api/index.ts:9](https://github.com/Xunnamius/xunnctl/blob/b2606e9/src/api/index.ts#L9)
