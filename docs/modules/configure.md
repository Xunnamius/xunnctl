[@-xun/ctl](../README.md) / configure

# Module: configure

## Table of contents

### Type Aliases

- [CustomExecutionContext](configure.md#customexecutioncontext)

### Functions

- [configureErrorHandlingEpilogue](configure.md#configureerrorhandlingepilogue)
- [configureExecutionContext](configure.md#configureexecutioncontext)

## Type Aliases

### CustomExecutionContext

Ƭ **CustomExecutionContext**: `ExecutionContext` & \{ `log`: `ExtendedLogger` ; `state`: \{ `isHushed`: `boolean` ; `isQuieted`: `boolean` ; `isSilenced`: `boolean`  } ; `taskManager`: `ListrManager`  }

#### Defined in

[xunnctl/src/configure.ts:24](https://github.com/Xunnamius/xunnctl/blob/e4e7e93/src/configure.ts#L24)

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
| `argv` | `Omit`\<`Partial`\<`Arguments`\>, typeof `$executionContext`\> & \{ `[$executionContext]`: `ExecutionContext`  } |
| `context` | [`CustomExecutionContext`](configure.md#customexecutioncontext) |

#### Returns

`Promisable`\<`void`\>

#### Defined in

[xunnctl/src/configure.ts:65](https://github.com/Xunnamius/xunnctl/blob/e4e7e93/src/configure.ts#L65)

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

[xunnctl/src/configure.ts:51](https://github.com/Xunnamius/xunnctl/blob/e4e7e93/src/configure.ts#L51)
