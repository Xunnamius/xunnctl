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

Ƭ **CustomExecutionContext**: `ExecutionContext` & \{ `debug_`: `ExtendedDebugger` ; `log`: `ExtendedLogger` ; `state`: \{ `isHushed`: `boolean` ; `isQuieted`: `boolean` ; `isSilenced`: `boolean` ; `startTime`: `Date`  } ; `taskManager`: `ListrManager`  }

#### Defined in

[src/configure.ts:32](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/configure.ts#L32)

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

[src/configure.ts:83](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/configure.ts#L83)

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

[src/configure.ts:67](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/configure.ts#L67)
