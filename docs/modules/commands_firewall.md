[@-xun/ctl](../README.md) / commands/firewall

# Module: commands/firewall

## Table of contents

### Type Aliases

- [CustomCliArguments](commands_firewall.md#customcliarguments)

### Functions

- [default](commands_firewall.md#default)

## Type Aliases

### CustomCliArguments

Ƭ **CustomCliArguments**: `GlobalCliArguments`

#### Defined in

[src/commands/firewall/index.ts:13](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/commands/firewall/index.ts#L13)

## Functions

### default

▸ **default**(`executionContext`): `Promise`\<\{ `aliases`: `string`[] ; `builder`: (...`args`: [blackFlag: Omit\<EffectorProgram\<GlobalCliArguments, CustomExecutionContext\>, "command" \| "fail" \| "parseAsync" \| "command\_deferred" \| "command\_finalize\_deferred"\>, helpOrVersionSet: boolean, argv?: Arguments\<GlobalCliArguments, CustomExecutionContext\>]) => \{ `[key: string]`: `_Options`;  } ; `description`: `string` = 'Tools to manage firewall state'; `handler`: (`argv`: `Arguments`\<`GlobalCliArguments`, `CustomExecutionContext`\>) => `Promisable`\<`void`\> ; `usage`: `string`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `executionContext` | `CustomExecutionContext` |

#### Returns

`Promise`\<\{ `aliases`: `string`[] ; `builder`: (...`args`: [blackFlag: Omit\<EffectorProgram\<GlobalCliArguments, CustomExecutionContext\>, "command" \| "fail" \| "parseAsync" \| "command\_deferred" \| "command\_finalize\_deferred"\>, helpOrVersionSet: boolean, argv?: Arguments\<GlobalCliArguments, CustomExecutionContext\>]) => \{ `[key: string]`: `_Options`;  } ; `description`: `string` = 'Tools to manage firewall state'; `handler`: (`argv`: `Arguments`\<`GlobalCliArguments`, `CustomExecutionContext`\>) => `Promisable`\<`void`\> ; `usage`: `string`  }\>

#### Defined in

[src/commands/firewall/index.ts:15](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/commands/firewall/index.ts#L15)
