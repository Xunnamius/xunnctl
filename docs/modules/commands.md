[@-xun/ctl](../README.md) / commands

# Module: commands

## Table of contents

### Type Aliases

- [CustomCliArguments](commands.md#customcliarguments)

### Functions

- [default](commands.md#default)

## Type Aliases

### CustomCliArguments

Ƭ **CustomCliArguments**: [`GlobalCliArguments`](util.md#globalcliarguments)

#### Defined in

[src/commands/index.ts:13](https://github.com/Xunnamius/xunnctl/blob/ec3f0bb/src/commands/index.ts#L13)

## Functions

### default

▸ **default**(`executionContext`): `Promise`\<\{ `builder`: (...`args`: [blackFlag: Omit\<EffectorProgram\<GlobalCliArguments, CustomExecutionContext\>, "command" \| "fail" \| "parseAsync" \| "command\_deferred" \| "command\_finalize\_deferred"\>, helpOrVersionSet: boolean, argv?: Arguments\<GlobalCliArguments, CustomExecutionContext\>]) => \{ `[key: string]`: `_Options`;  } ; `description`: `string` = "Xunnamius's personal switchblade CLI tool"; `handler`: (`argv`: `Arguments`\<[`GlobalCliArguments`](util.md#globalcliarguments), [`CustomExecutionContext`](configure.md#customexecutioncontext)\>) => `Promisable`\<`void`\> ; `name`: `string` = 'xunnctl'; `usage`: `string`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `executionContext` | [`CustomExecutionContext`](configure.md#customexecutioncontext) |

#### Returns

`Promise`\<\{ `builder`: (...`args`: [blackFlag: Omit\<EffectorProgram\<GlobalCliArguments, CustomExecutionContext\>, "command" \| "fail" \| "parseAsync" \| "command\_deferred" \| "command\_finalize\_deferred"\>, helpOrVersionSet: boolean, argv?: Arguments\<GlobalCliArguments, CustomExecutionContext\>]) => \{ `[key: string]`: `_Options`;  } ; `description`: `string` = "Xunnamius's personal switchblade CLI tool"; `handler`: (`argv`: `Arguments`\<[`GlobalCliArguments`](util.md#globalcliarguments), [`CustomExecutionContext`](configure.md#customexecutioncontext)\>) => `Promisable`\<`void`\> ; `name`: `string` = 'xunnctl'; `usage`: `string`  }\>

#### Defined in

[src/commands/index.ts:15](https://github.com/Xunnamius/xunnctl/blob/ec3f0bb/src/commands/index.ts#L15)
