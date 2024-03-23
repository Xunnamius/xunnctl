[@-xun/ctl](../README.md) / api

# Module: api

## Table of contents

### Functions

- [makeApiCaller](api.md#makeapicaller)

## Functions

### makeApiCaller

▸ **makeApiCaller**(`«destructured»`): (`__namedParameters`: \{ `body?`: `JsonValue` ; `uri`: `string`  } & `Omit`\<`RequestInit`, ``"body"``\> & \{ `[additionalOption: string]`: `unknown`;  }) => `Promise`\<[response: Response, responseBody: string]\>

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

[src/api/index.ts:9](https://github.com/Xunnamius/xunnctl/blob/ed9ea99/src/api/index.ts#L9)
