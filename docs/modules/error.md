[@-xun/ctl](../README.md) / error

# Module: error

## Table of contents

### Variables

- [ErrorMessage](error.md#errormessage)

## Variables

### ErrorMessage

• `Const` **ErrorMessage**: `Object`

A collection of possible error and warning messages.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `AppValidationFailure` | () => `string` |
| `AuthFailure` | () => `string` |
| `ClientValidationFailure` | () => `string` |
| `GuruMeditation` | () => `string` |
| `HttpFailure` | (`error?`: `string`) => `string` |
| `HttpSubFailure` | (`error`: ``null`` \| `string`, `statusCode`: `number`) => `string` |
| `InvalidAppConfiguration` | (`details?`: `string`) => `string` |
| `InvalidAppEnvironment` | (`details?`: `string`) => `string` |
| `InvalidClientConfiguration` | (`details?`: `string`) => `string` |
| `InvalidItem` | (`item`: `unknown`, `itemName`: `string`) => `string` |
| `InvalidSecret` | (`secretType`: `string`) => `string` |
| `ItemNotFound` | (`item`: `unknown`, `itemName`: `string`) => `string` |
| `ItemOrItemsNotFound` | (`itemsName`: `string`) => `string` |
| `NotAuthenticated` | () => `string` |
| `NotAuthorized` | () => `string` |
| `NotFound` | () => `string` |
| `NotImplemented` | () => `string` |
| `ValidationFailure` | () => `string` |
| `AssertionFailureBadConfigurationPath` | (`path`: `unknown`) => `string` |
| `AssertionFailureBadParameterCombination` | () => `string` |
| `AssertionFailureCannotExecuteMultipleTimes` | () => `string` |
| `AssertionFailureConfigureExecutionEpilogue` | () => `string` |
| `AssertionFailureDuplicateCommandName` | (`parentFullName`: `undefined` \| `string`, `name1`: `string`, `type1`: ``"name"`` \| ``"alias"``, `name2`: `string`, `type2`: ``"name"`` \| ``"alias"``) => `string` |
| `AssertionFailureInvalidCommandExport` | (`name`: `string`) => `string` |
| `AssertionFailureInvocationNotAllowed` | (`name`: `string`) => `string` |
| `AssertionFailureNoConfigurationLoaded` | (`path`: `string`) => `string` |
| `AssertionFailureReachedTheUnreachable` | () => `string` |
| `AssertionFailureUseParseAsyncInstead` | () => `string` |
| `CommandNotImplemented` | () => `string` |
| `ConfigLoadFailure` | (`path`: `string`) => `string` |
| `ConfigSaveFailure` | () => `string` |
| `FailedCloudflareIpFetch` | () => `string` |
| `FrameworkError` | (`error`: `unknown`) => `string` |
| `Generic` | () => `string` |
| `GracefulEarlyExit` | () => `string` |
| `InvalidCharacters` | (`str`: `string`, `violation`: `string`) => `string` |
| `InvalidCommandInvocation` | () => `string` |
| `InvalidConfigureArgumentsReturnType` | () => `string` |
| `InvalidConfigureExecutionContextReturnType` | () => `string` |
| `MissingConfigurationKey` | (`key`: `string`) => `string` |

#### Defined in

[src/error.ts:7](https://github.com/Xunnamius/xunnctl/blob/12ada31/src/error.ts#L7)
