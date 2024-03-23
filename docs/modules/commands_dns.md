[@-xun/ctl](../README.md) / commands/dns

# Module: commands/dns

## Table of contents

### Type Aliases

- [CustomCliArguments](commands_dns.md#customcliarguments)

### Functions

- [default](commands_dns.md#default)

## Type Aliases

### CustomCliArguments

Ƭ **CustomCliArguments**: `GlobalCliArguments`

#### Defined in

[src/commands/dns/index.ts:13](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/commands/dns/index.ts#L13)

## Functions

### default

▸ **default**(`«destructured»`): `Promise`\<\{ `aliases`: `string`[] ; `builder`: (...`args`: [blackFlag: Omit\<EffectorProgram\<GlobalCliArguments, CustomExecutionContext\>, "command" \| "fail" \| "parseAsync" \| "command\_deferred" \| "command\_finalize\_deferred"\>, helpOrVersionSet: boolean, argv?: Arguments\<GlobalCliArguments, CustomExecutionContext\>]) => \{ `[key: string]`: `_Options`;  } ; `description`: `string` = 'Tools for DNS-related tasks'; `handler`: (`argv`: `Arguments`\<`GlobalCliArguments`, `CustomExecutionContext`\>) => `Promisable`\<`void`\> ; `usage`: `string`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `CustomExecutionContext` |

#### Returns

`Promise`\<\{ `aliases`: `string`[] ; `builder`: (...`args`: [blackFlag: Omit\<EffectorProgram\<GlobalCliArguments, CustomExecutionContext\>, "command" \| "fail" \| "parseAsync" \| "command\_deferred" \| "command\_finalize\_deferred"\>, helpOrVersionSet: boolean, argv?: Arguments\<GlobalCliArguments, CustomExecutionContext\>]) => \{ `[key: string]`: `_Options`;  } ; `description`: `string` = 'Tools for DNS-related tasks'; `handler`: (`argv`: `Arguments`\<`GlobalCliArguments`, `CustomExecutionContext`\>) => `Promisable`\<`void`\> ; `usage`: `string`  }\>

#### Defined in

[src/commands/dns/index.ts:15](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/commands/dns/index.ts#L15)
