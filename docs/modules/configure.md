[@-xun/ctl](../README.md) / configure

# Module: configure

## Table of contents

### Type Aliases

- [CustomExecutionContext](configure.md#customexecutioncontext)

### Variables

- [$executionContext](configure.md#$executioncontext)

### Functions

- [configureErrorHandlingEpilogue](configure.md#configureerrorhandlingepilogue)
- [configureExecutionContext](configure.md#configureexecutioncontext)

## Type Aliases

### CustomExecutionContext

Ƭ **CustomExecutionContext**: `ExecutionContext` & \{ `debug_`: `ExtendedDebugger` ; `log`: `ExtendedLogger` ; `state`: \{ `isHushed`: `boolean` ; `isQuieted`: `boolean` ; `isSilenced`: `boolean` ; `startTime`: `Date`  } ; `taskManager`: `ListrManager`  }

#### Defined in

[src/configure.ts:37](https://github.com/Xunnamius/xunnctl/blob/4fc9d35/src/configure.ts#L37)

## Variables

### $executionContext

• `Const` **$executionContext**: unique `symbol`

A symbol allowing access to the `ExecutionContext` object "hidden" within
each `Arguments` instance.

#### Defined in

node_modules/@black-flag/core/dist/src/constant.d.ts:5

## Functions

### configureErrorHandlingEpilogue

▸ **configureErrorHandlingEpilogue**(`meta`, `argv`, `context`): `Promisable`\<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `meta` | `Object` |
| `meta.error` | `unknown` |
| `meta.exitCode` | `number` |
| `meta.message` | `string` |
| `argv` | `Omit`\<`Partial`\<`Arguments`\>, typeof [`$executionContext`](configure.md#$executioncontext)\> & \{ `[$executionContext]`: `ExecutionContext`  } |
| `context` | [`CustomExecutionContext`](configure.md#customexecutioncontext) |

#### Returns

`Promisable`\<`void`\>

#### Defined in

[src/configure.ts:88](https://github.com/Xunnamius/xunnctl/blob/4fc9d35/src/configure.ts#L88)

___

### configureExecutionContext

▸ **configureExecutionContext**(`context`): `Promisable`\<`ExecutionContext`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `ExecutionContext` |

#### Returns

`Promisable`\<`ExecutionContext`\>

#### Defined in

[src/configure.ts:72](https://github.com/Xunnamius/xunnctl/blob/4fc9d35/src/configure.ts#L72)
