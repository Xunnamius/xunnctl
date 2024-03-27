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

[src/util.ts:137](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L137)

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

[src/util.ts:32](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L32)

___

### ListrTaskLiteral

Ƭ **ListrTaskLiteral**: `Exclude`\<`Parameters`\<`ListrManager`[``"add"``]\>[``0``], `Function`\>[`number`]

#### Defined in

[src/util.ts:463](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L463)

___

### WithGlobalOptionsReturnType

Ƭ **WithGlobalOptionsReturnType**\<`CustomCliArguments`\>: [builder: Function, builderData: Object]

#### Type parameters

| Name | Type |
| :------ | :------ |
| `CustomCliArguments` | extends [`GlobalCliArguments`](util.md#globalcliarguments) |

#### Defined in

[src/util.ts:125](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L125)

## Functions

### getWellKnownConfigPath

▸ **getWellKnownConfigPath**(): `Promise`\<`string`\>

Returns a well-known configuration path.

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/util.ts:82](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L82)

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

[src/util.ts:91](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L91)

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

[src/util.ts:558](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L558)

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

[src/util.ts:526](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L526)

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

[src/util.ts:71](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L71)

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

[src/util.ts:64](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L64)

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

[src/util.ts:42](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L42)

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

[src/util.ts:49](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L49)

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

[src/util.ts:171](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L171)

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

[src/util.ts:391](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L391)

___

### withStandardListrTaskConfig

▸ **withStandardListrTaskConfig**\<`T`\>(`«destructured»`): `ListrTask`\<`unknown`, typeof `DefaultRenderer` \| typeof `VerboseRenderer`, typeof `SimpleRenderer`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `ApiCallerFactory` |

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `«destructured»` | `Object` | `undefined` |
| › `apiCallerFactory` | `T` | `undefined` |
| › `callback` | (`context`: \{ `api`: `Awaited`\<`ReturnType`\<`T`\>\> ; `ctx`: `any` ; `taskLogger`: `ExtendedLogger` ; `thisTask`: `TaskWrapper`\<`unknown`, typeof `DefaultRenderer` \| typeof `VerboseRenderer`, typeof `SimpleRenderer`\>  }) => `void` \| `ListrTaskResult`\<`unknown`\> | `undefined` |
| › `configPath` | `string` | `undefined` |
| › `debug` | `ExtendedDebugger` | `undefined` |
| › `initialTitle` | `string` | `undefined` |
| › `shouldRetry?` | `number` \| ``false`` | `false` |

#### Returns

`ListrTask`\<`unknown`, typeof `DefaultRenderer` \| typeof `VerboseRenderer`, typeof `SimpleRenderer`\>

#### Defined in

[src/util.ts:469](https://github.com/Xunnamius/xunnctl/blob/d33e23e/src/util.ts#L469)
