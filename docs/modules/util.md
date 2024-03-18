[@-xun/ctl](../README.md) / util

# Module: util

## Table of contents

### Type Aliases

- [GlobalCliArguments](util.md#globalcliarguments)

### Functions

- [getWellKnownConfigPath](util.md#getwellknownconfigpath)
- [logStartTime](util.md#logstarttime)
- [makeUsageString](util.md#makeusagestring)
- [withGlobalOptions](util.md#withglobaloptions)
- [withGlobalOptionsHandling](util.md#withglobaloptionshandling)

## Type Aliases

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

[src/util.ts:13](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/util.ts#L13)

## Functions

### getWellKnownConfigPath

▸ **getWellKnownConfigPath**(): `Promise`\<`string`\>

Returns a well-known configuration path.

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/util.ts:34](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/util.ts#L34)

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

[src/util.ts:43](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/util.ts#L43)

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

[src/util.ts:23](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/util.ts#L23)

___

### withGlobalOptions

▸ **withGlobalOptions**\<`CustomCliArguments`\>(`customBuilder?`): `Promise`\<`Configuration`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>[``"builder"``]\>

Returns a builder function that wraps `customBuilder` to provide standard CLI
options (i.e. config-path, silent, etc). Most if not all commands should wrap
their builder objects/functions with this function.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `CustomCliArguments` | extends [`GlobalCliArguments`](util.md#globalcliarguments) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `customBuilder?` | \{ `[key: string]`: `_Options`;  } \| (`blackFlag`: `Omit`\<`EffectorProgram`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>, ``"command"`` \| ``"fail"`` \| ``"parseAsync"`` \| ``"command_deferred"`` \| ``"command_finalize_deferred"``\>, `helpOrVersionSet`: `boolean`, `argv?`: `Arguments`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>) => `void` \| `Argv`\<{}\> \| `EffectorProgram`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\> \| \{ `[key: string]`: `_Options`;  } |

#### Returns

`Promise`\<`Configuration`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>[``"builder"``]\>

#### Defined in

[src/util.ts:63](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/util.ts#L63)

___

### withGlobalOptionsHandling

▸ **withGlobalOptionsHandling**\<`CustomCliArguments`\>(`customHandler`): `Promise`\<`Configuration`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>[``"handler"``]\>

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
| `customHandler` | (`argv`: `Arguments`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>) => `Promisable`\<`void`\> |

#### Returns

`Promise`\<`Configuration`\<`CustomCliArguments`, [`CustomExecutionContext`](configure.md#customexecutioncontext)\>[``"handler"``]\>

#### Defined in

[src/util.ts:103](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/util.ts#L103)
