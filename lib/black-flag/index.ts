// TODO: replace with appropriate exports entries in package.json

export { configureProgram, makeProgram } from 'multiverse/black-flag/src/index';
export { runProgram } from 'multiverse/black-flag/src/util';

export {
  $executionContext,
  DEFAULT_USAGE_TEXT,
  FrameworkExitCode
} from 'multiverse/black-flag/src/constant';

export {
  AssertionFailedError,
  CliError,
  CommandNotImplementedError,
  ErrorMessage,
  GracefulEarlyExitError,
  type CliErrorOptions
} from 'multiverse/black-flag/src/error';

export type {
  ConfigureArguments,
  ConfigureErrorHandlingEpilogue,
  ConfigureExecutionContext,
  ConfigureExecutionEpilogue,
  ConfigureExecutionPrologue,
  ConfigureHooks
} from 'multiverse/black-flag/types/configure';

export type {
  AnyConfiguration,
  ChildConfiguration,
  Configuration,
  ImportedConfigurationModule,
  ParentConfiguration,
  RootConfiguration
} from 'multiverse/black-flag/types/module';

export type {
  AnyArguments,
  AnyProgram,
  Arguments,
  ExecutionContext,
  Executor,
  FrameworkArguments,
  PreExecutionContext,
  Program,
  ProgramMetadata
} from 'multiverse/black-flag/types/program';
