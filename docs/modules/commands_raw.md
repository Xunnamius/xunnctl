[@-xun/ctl](../README.md) / commands/raw

# Module: commands/raw

## Table of contents

### Type Aliases

- [CustomCliArguments](commands_raw.md#customcliarguments)

### Variables

- [validIdChoices](commands_raw.md#valididchoices)

### Functions

- [default](commands_raw.md#default)

## Type Aliases

### CustomCliArguments

Ƭ **CustomCliArguments**: `GlobalCliArguments` & \{ `id`: typeof [`validIdChoices`](commands_raw.md#valididchoices)[keyof typeof [`validIdChoices`](commands_raw.md#valididchoices)]  }

#### Defined in

[src/commands/raw/index.ts:17](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/commands/raw/index.ts#L17)

## Variables

### validIdChoices

• `Const` **validIdChoices**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `confNginxAllowOnlyCloudflare` | ``"conf.nginx.allowOnlyCloudflare"`` |

#### Defined in

[src/commands/raw/index.ts:21](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/commands/raw/index.ts#L21)

## Functions

### default

▸ **default**(`«destructured»`): `Promise`\<\{ `aliases`: `string`[] ; `builder`: (...`args`: [blackFlag: Omit\<EffectorProgram\<CustomCliArguments, CustomExecutionContext\>, "command" \| "fail" \| "parseAsync" \| "command\_deferred" \| "command\_finalize\_deferred"\>, helpOrVersionSet: boolean, argv?: Arguments\<CustomCliArguments, CustomExecutionContext\>]) => \{ `[key: string]`: `_Options`;  } ; `description`: `string` = 'Dump freeform data into stdout'; `handler`: (`argv`: `Arguments`\<[`CustomCliArguments`](commands_raw.md#customcliarguments), `CustomExecutionContext`\>) => `Promisable`\<`void`\> ; `usage`: `string`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `CustomExecutionContext` |

#### Returns

`Promise`\<\{ `aliases`: `string`[] ; `builder`: (...`args`: [blackFlag: Omit\<EffectorProgram\<CustomCliArguments, CustomExecutionContext\>, "command" \| "fail" \| "parseAsync" \| "command\_deferred" \| "command\_finalize\_deferred"\>, helpOrVersionSet: boolean, argv?: Arguments\<CustomCliArguments, CustomExecutionContext\>]) => \{ `[key: string]`: `_Options`;  } ; `description`: `string` = 'Dump freeform data into stdout'; `handler`: (`argv`: `Arguments`\<[`CustomCliArguments`](commands_raw.md#customcliarguments), `CustomExecutionContext`\>) => `Promisable`\<`void`\> ; `usage`: `string`  }\>

#### Defined in

[src/commands/raw/index.ts:25](https://github.com/Xunnamius/xunnctl/blob/b15529f/src/commands/raw/index.ts#L25)
