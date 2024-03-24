[@-xun/ctl](../README.md) / util

# Module: util

## Table of contents

### Type Aliases

- [ExtendedBuilderObject](util.md#extendedbuilderobject)
- [GlobalCliArguments](util.md#globalcliarguments)
- [ListrTaskLiteral](util.md#listrtaskliteral)
- [WithGlobalOptionsReturnType](util.md#withglobaloptionsreturntype)

### Functions

- [getWellKnownConfigPath](util.md#getwellknownconfigpath)
- [logStartTime](util.md#logstarttime)
- [makeIpToCidrFn](util.md#makeiptocidrfn)
- [makeLocalErrorReportingWrapper](util.md#makelocalerrorreportingwrapper)
- [makeUsageString](util.md#makeusagestring)
- [toFirstLowerCase](util.md#tofirstlowercase)
- [toSentenceCase](util.md#tosentencecase)
- [toSpacedSentenceCase](util.md#tospacedsentencecase)
- [withGlobalOptions](util.md#withglobaloptions)
- [withGlobalOptionsHandling](util.md#withglobaloptionshandling)
- [withStandardListrTaskConfig](util.md#withstandardlistrtaskconfig)

## Type Aliases

### ExtendedBuilderObject

Ƭ **ExtendedBuilderObject**: `Object`

#### Index signature

▪ [key: `string`]: `Omit`\<`Options`, ``"demandOption"``\> & \{ `demandOption?`: `Options`[``"demandOption"``] \| `string`[]  }

#### Defined in

[src/util.ts:136](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L136)

___

### GlobalCliArguments

Ƭ **GlobalCliArguments**: `Object`

These properties will be available in the `argv` object of any command that
uses `withGlobalOptions` to construct its `builder`.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `config-path` | `string` |
| `hush` | `boolean` |
| `quiet` | `boolean` |
| `silent` | `boolean` |

#### Defined in

[src/util.ts:31](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L31)

___

### ListrTaskLiteral

Ƭ **ListrTaskLiteral**: `Exclude`\<`Parameters`\<`ListrManager`[``"add"``]\>[``0``], `Function`\>[`number`]

#### Defined in

[src/util.ts:462](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L462)

___

### WithGlobalOptionsReturnType

Ƭ **WithGlobalOptionsReturnType**\<`CustomCliArguments`\>: [builder: Function, builderData: Object]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `CustomCliArguments` | extends [`GlobalCliArguments`](util.md#globalcliarguments) |

#### Defined in

[src/util.ts:124](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L124)

## Functions

### getWellKnownConfigPath

▸ **getWellKnownConfigPath**(): `Promise`\<`string`\>

Returns a well-known configuration path.

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/util.ts:81](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L81)

___

### logStartTime

▸ **logStartTime**(`«destructured»`): `void`

Prints a timestamp indicating the beginning of execution.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `log` | `ExtendedLogger` |
| › `startTime` | `Date` |

#### Returns

`void`

#### Defined in

[src/util.ts:90](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L90)

___

### makeIpToCidrFn

▸ **makeIpToCidrFn**\<`T`\>(`context`): (`__namedParameters`: \{ `ip`: `string`  } & `T`) => \{ `cidr`: `CIDR`  } & `Omit`\<\{ `ip`: `string`  } & `T`, ``"ip"``\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `string` |

#### Returns

`fn`

▸ (`«destructured»`): \{ `cidr`: `CIDR`  } & `Omit`\<\{ `ip`: `string`  } & `T`, ``"ip"``\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | \{ `ip`: `string`  } & `T` |

##### Returns

\{ `cidr`: `CIDR`  } & `Omit`\<\{ `ip`: `string`  } & `T`, ``"ip"``\>

#### Defined in

[src/util.ts:555](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L555)

___

### makeLocalErrorReportingWrapper

▸ **makeLocalErrorReportingWrapper**(`«destructured»`): (`subject`: `string`, `fn`: () => `Promisable`\<`void`\>) => `Promise`\<`void`\>

Make it easier to report output via Listr2 when tasks start, succeed, and
fail.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `errorPrefix` | `string` | `undefined` |
| › `ignoreErrors?` | `boolean` | `false` |
| › `startedPrefix` | `string` | `undefined` |
| › `successPrefix` | `string` | `undefined` |
| › `taskLogger` | `ExtendedLogger` | `undefined` |

#### Returns

`fn`

▸ (`subject`, `fn`): `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `subject` | `string` |
| `fn` | () => `Promisable`\<`void`\> |

##### Returns

`Promise`\<`void`\>

#### Defined in

[src/util.ts:523](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L523)

___

### makeUsageString

▸ **makeUsageString**(`altDescription?`): `string`

Generate standard command usage text.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `altDescription` | `string` | `'$1.'` |

#### Returns

`string`

#### Defined in

[src/util.ts:70](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L70)

___

### toFirstLowerCase

▸ **toFirstLowerCase**(`str`): `string`

Lower-cases the first letter of `str`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[src/util.ts:63](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L63)

___

### toSentenceCase

▸ **toSentenceCase**(`str`): `string`

Upper-cases the first letter of `str`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[src/util.ts:41](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L41)

___

### toSpacedSentenceCase

▸ **toSpacedSentenceCase**(`str`): `string`

Upper-cases the first letter of `str`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |

#### Returns

`string`

#### Defined in

[src/util.ts:48](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L48)

___

### withGlobalOptions

▸ **withGlobalOptions**\<`CustomCliArguments`\>(`customBuilder?`, `hasVersion?`): `Promise`\<[`WithGlobalOptionsReturnType`](util.md#withglobaloptionsreturntype)\<`CustomCliArguments`\>\>

Returns a builder function (alongside a live data context) that wraps
`customBuilder` to provide standard CLI options (i.e. config-path, silent,
etc). Most if not all commands should wrap their builder objects/functions
with this function.

This function enables three additional optionals-related units of
functionality:

1. Implements https://github.com/yargs/yargs/issues/2392 via analysis of the
   returned options object to perform mutual exclusivity checks per
   exclusivity group (represented by `conflicts`). That is: providing `{
   demandOption: true, conflicts: ['x', 'y'] }` for both the `x` and `y`
   commands (including hyphens) will trigger a check to ensure exactly one of
   those two options was given. Commands that are listed as conflicts in one
   command but not the other are allowed.

2. Providing `{ demandOption: ['x', 'y'] }` for both the `x` and `y` commands
   (including hyphens) will trigger a check to ensure at least one of those
   two options was given. Providing such a value for `demandOption` on one
   command but not the other will result in an assertion failure.

3. Handles command grouping automatically. However, not that this function
   handles command grouping for you **only if you return an options object**
   and **only if you add options via said options object**. Specifically:
   calling `blackFlag.options(...)` within `customBuilder` will cause
   undefined behavior.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `CustomCliArguments` | extends [`GlobalCliArguments`](util.md#globalcliarguments) |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `customBuilder?` | [`ExtendedBuilderObject`](util.md#extendedbuilderobject) \| (...`args`: [blackFlag: Omit\<EffectorProgram\<CustomCliArguments, CustomExecutionContext\>, "command" \| "fail" \| "parseAsync" \| "command\_deferred" \| "command\_finalize\_deferred"\>, helpOrVersionSet: boolean, argv?: Arguments\<CustomCliArguments, CustomExecutionContext\>]) => [`ExtendedBuilderObject`](util.md#extendedbuilderobject) | `undefined` |
| `hasVersion` | `boolean` | `false` |

#### Returns

`Promise`\<[`WithGlobalOptionsReturnType`](util.md#withglobaloptionsreturntype)\<`CustomCliArguments`\>\>

#### Defined in

[src/util.ts:170](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L170)

___

### withGlobalOptionsHandling

▸ **withGlobalOptionsHandling**\<`CustomCliArguments`\>(`builderData`, `customHandler`): `Promise`\<`Configuration`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>[``"handler"``]\>

Returns a handler function that wraps `customHandler` to provide the
functionality for the standard CLI options (i.e. config-path, silent, etc).
Most if not all commands should wrap their handler functions with this
function.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `CustomCliArguments` | extends [`GlobalCliArguments`](util.md#globalcliarguments) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `builderData` | `Object` |
| `builderData.handlerPreCheckData` | `Object` |
| `builderData.handlerPreCheckData.atLeastOneOfOptions` | `string`[][] |
| `builderData.handlerPreCheckData.mutuallyConflictedOptions` | `string`[][] |
| `customHandler` | (`argv`: `Arguments`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>) => `Promisable`\<`void`\> |

#### Returns

`Promise`\<`Configuration`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>[``"handler"``]\>

#### Defined in

[src/util.ts:390](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L390)

___

### withStandardListrTaskConfig

▸ **withStandardListrTaskConfig**(`«destructured»`): `ListrTask`\<`unknown`, typeof `DefaultRenderer` \| typeof `VerboseRenderer`, typeof `SimpleRenderer`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `callback` | (`context`: \{ `ctx`: `any` ; `dns`: \{ `addHostileIps`: (`__namedParameters`: \{ `accountId`: `string` ; `listId`: `string` ; `targetIps`: `string`[]  }) => `Promise`\<`void`\> ; `callApi`: \<Result, ResponseJson\>(`callApiOptions`: \{ `body?`: `JsonValue` ; `uri`: `string`  } & `Omit`\<`RequestInit`, ``"body"``\> & \{ `[additionalOption: string]`: `unknown`;  }, `__namedParameters`: \{ `parseResultJson?`: `boolean` = true }) => `Promise`\<`Result` extends `undefined` ? [result: Response, responseBody: string] : [result: Result, responseJson: ResponseJson]\> ; `createDnsARecord`: (`__namedParameters`: \{ `domainName`: `string` ; `ipv4`: `string` ; `proxied`: `boolean` = false; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsAaaaRecord`: (`__namedParameters`: \{ `domainName`: `string` ; `ipv6`: `string` ; `proxied`: `boolean` = false; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsCaaRecords`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsCnameRecord`: (`__namedParameters`: \{ `domainName`: `string` ; `proxied`: `boolean` = false; `redirectToHostname`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsMxRecord`: (`__namedParameters`: \{ `domainName`: `string` ; `mailHostname`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsRecord`: (`__namedParameters`: \{ `[additionalOption: string]`: `unknown`; `domainName`: `string` ; `type`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsTxtRecord`: (`__namedParameters`: \{ `content`: `string` ; `domainName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `createDnsZone`: (`__namedParameters`: \{ `accountId`: `string` ; `domainName`: `string`  }) => `Promise`\<`string`\> ; `createDnsZoneCustomFirewallRulesetRule`: (`__namedParameters`: \{ `[additionalOption: string]`: `unknown`; `allowDuplicate?`: `boolean` ; `ruleAction`: `string` ; `ruleDescription`: `string` ; `ruleExpression`: `string` ; `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`string`\> ; `createDnsZoneRulesetRule`: (`__namedParameters`: \{ `[additionalOption: string]`: `unknown`; `action`: `string` ; `description`: `string` ; `expression`: `string` ; `rulesetId`: `string` ; `zoneId`: `string`  }) => `Promise`\<`string`\> ; `deleteDnsRecord`: (`__namedParameters`: \{ `recordId`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `deleteDnsZone`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`void`\> ; `deleteDnsZoneCustomFirewallRuleset`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`void`\> ; `deleteHostileIps`: (`__namedParameters`: \{ `accountId`: `string` ; `listId`: `string` ; `listItemIds`: `string`[]  }) => `Promise`\<`void`\> ; `getCloudflareIps`: () => `Promise`\<\{ `ipv4`: `string`[] ; `ipv6`: `string`[]  }\> ; `getDnsRecord`: (`__namedParameters`: \{ `fullDomainName`: `string` ; `type`: `string` ; `zoneId`: `string`  }) => `Promise`\<`undefined` \| `ResourceRecord`\> ; `getDnsRecordId`: (`__namedParameters`: \{ `fullDomainName`: `string` ; `type`: `string` ; `zoneId`: `string`  }) => `Promise`\<`undefined` \| `string`\> ; `getDnsRecords`: (`__namedParameters`: \{ `recordName?`: `string` ; `recordType?`: `string` ; `zoneId`: `string`  }) => `Promise`\<`ResourceRecord`[]\> ; `getDnsZone`: (`__namedParameters`: \{ `domainName`: `string`  }) => `Promise`\<`undefined` \| `Zone`\> ; `getDnsZoneCustomFirewallRuleset`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`undefined` \| `Ruleset`\> ; `getDnsZoneCustomFirewallRulesetId`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`string`\> ; `getDnsZoneCustomFirewallRulesetRules`: (`__namedParameters`: \{ `rulesetPhaseName`: `string` ; `zoneId`: `string`  }) => `Promise`\<`RulesetRule`[]\> ; `getDnsZoneId`: (`__namedParameters`: \{ `domainName`: `string`  }) => `Promise`\<`undefined` \| `string`\> ; `getDnsZoneRulesetRules`: (`__namedParameters`: \{ `rulesetId`: `string` ; `zoneId`: `string`  }) => `Promise`\<`RulesetRule`[]\> ; `getDnsZoneRulesets`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`Ruleset`[]\> ; `getDnsZones`: () => `Promise`\<`Zone`[]\> ; `getHostileIps`: (`__namedParameters`: \{ `accountId`: `string` ; `listId`: `string`  }) => `Promise`\<`HostileIp`[]\> ; `reinitializeDnsZone`: (`__namedParameters`: \{ `zoneId`: `string`  }) => `Promise`\<`void`\>  } ; `taskLogger`: `ExtendedLogger` ; `thisTask`: `TaskWrapper`\<`unknown`, typeof `DefaultRenderer` \| typeof `VerboseRenderer`, typeof `SimpleRenderer`\>  }) => `void` \| `ListrTaskResult`\<`unknown`\> | `undefined` |
| › `configPath` | `string` | `undefined` |
| › `debug` | `ExtendedDebugger` | `undefined` |
| › `initialTitle` | `string` | `undefined` |
| › `shouldRetry?` | `number` \| ``false`` | `false` |

#### Returns

`ListrTask`\<`unknown`, typeof `DefaultRenderer` \| typeof `VerboseRenderer`, typeof `SimpleRenderer`\>

#### Defined in

[src/util.ts:468](https://github.com/Xunnamius/xunnctl/blob/7275721/src/util.ts#L468)
