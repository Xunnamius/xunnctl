[@-xun/ctl](../README.md) / [error](../modules/error.md) / TaskError

# Class: TaskError

[error](../modules/error.md).TaskError

An `Error` class where the first letter of the message is capitalized.

## Hierarchy

- `Error`

  ↳ **`TaskError`**

## Table of contents

### Constructors

- [constructor](error.TaskError.md#constructor)

### Properties

- [cause](error.TaskError.md#cause)
- [message](error.TaskError.md#message)
- [name](error.TaskError.md#name)
- [stack](error.TaskError.md#stack)
- [prepareStackTrace](error.TaskError.md#preparestacktrace)
- [stackTraceLimit](error.TaskError.md#stacktracelimit)

### Methods

- [captureStackTrace](error.TaskError.md#capturestacktrace)

## Constructors

### constructor

• **new TaskError**(`...args`): [`TaskError`](error.TaskError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | [message?: string, options?: ErrorOptions] |

#### Returns

[`TaskError`](error.TaskError.md)

#### Overrides

Error.constructor

#### Defined in

[src/error.ts:8](https://github.com/Xunnamius/xunnctl/blob/b2606e9/src/error.ts#L8)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

Error.cause

#### Defined in

node_modules/typescript/lib/lib.es2022.error.d.ts:24

___

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1077

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1076

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1078

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Type declaration

▸ (`err`, `stackTraces`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

Error.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:28

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Defined in

node_modules/@types/node/globals.d.ts:30

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:21
