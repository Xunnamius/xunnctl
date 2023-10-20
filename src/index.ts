import { isNativeError } from 'node:util/types';

import { ListrErrorTypes } from 'listr2';
import { name as pkgName } from 'package';
import yargs from 'yargs/yargs';

import {
  createDebugLogger,
  createGenericLogger,
  createListrManager
} from 'multiverse/rejoinder';

import {
  configureArguments,
  configureErrorHandlingEpilogue,
  configureExecutionContext,
  configureExecutionEpilogue,
  configureExecutionPrologue
} from 'universe/configure';

import {
  $executionContext,
  CONFIG_MODULES_ROOT_PATH,
  FrameworkExitCode,
  LogTag,
  MAX_LOG_ERROR_ENTRIES
} from 'universe/constant';

import { discoverCommands } from 'universe/discover';

import {
  AssertionFailedError,
  CliError,
  ErrorMessage,
  isCliError,
  isGracefulEarlyExitError
} from 'universe/error';

import type {
  Arguments,
  ExecutionContext,
  Executor,
  PreExecutionContext,
  Program
} from 'types/global';

const { IF_NOT_SILENCED, IF_NOT_QUIETED, IF_NOT_HUSHED } = LogTag;
const rootDebugLogger = createDebugLogger({ namespace: pkgName });
const rootGenericLogger = createGenericLogger({ namespace: pkgName });
const log = rootGenericLogger;
const debug = rootDebugLogger.extend('index');

/**
 * Create and return a pre-configured Yargs instance (program) and argv parser.
 */
export async function configureProgram(): Promise<PreExecutionContext>;
/**
 * Configure an existing Yargs instance (program) and return an argv parser.
 *
 * @param program A Yargs instance to configure
 */
export async function configureProgram(
  program: Program<Record<string, unknown>>
): Promise<PreExecutionContext>;
export async function configureProgram(
  program?: Program<Record<string, unknown>>
): Promise<PreExecutionContext> {
  debug('configureProgram was invoked');

  const taskManager = createListrManager();
  const rootProgram = program || makeProgram<Record<string, unknown>>();

  // ? Redundancy for extra type safety (config fns could be redefined later)
  const context = asUnenumerable(
    configureExecutionContext({
      commands: new Map(),
      log: rootGenericLogger,
      debug: rootDebugLogger,
      taskManager,
      state: {
        rawArgv: [],
        isSilenced: false,
        isQuieted: false,
        isHushed: false,
        initialTerminalWidth: rootProgram.terminalWidth()
      }
    })
  );

  debug('execution context: %O', asEnumerable(context));

  if (!context) {
    throw new CliError(ErrorMessage.InvalidConfigureExecutionContextReturnType());
  }

  debug.message(
    'to save space, ExecutionContext will be unenumerable from this point on'
  );

  const reference = await discoverCommands(
    CONFIG_MODULES_ROOT_PATH,
    rootProgram,
    context
  );

  configureExecutionPrologue(rootProgram, context);

  const parseAndExecuteWithErrorHandling: Executor = async (argv_) => {
    debug('execute was invoked');

    try {
      debug('raw argv: %O', argv_);

      const argv: typeof process.argv | undefined = configureArguments(
        argv_?.length ? argv_ : process.argv,
        context
      );

      if (!Array.isArray(argv)) {
        throw new AssertionFailedError(
          ErrorMessage.InvalidConfigureArgumentsReturnType()
        );
      }

      debug('configured argv (initialRawArgv): %O', argv);

      context.state.rawArgv = argv;

      const finalParseResult = await rootProgram.parseAsync(
        argv,
        wrapExecutionContext(context)
      );

      // ? If commands were auto-discovered, a handler was likely executed.
      // ? Return the part result from the first command that finishes
      // ? executing. If no commands were auto-discovered, then return as is the
      // ? result of calling `parseAsync` on the root program.
      const parsedArgv = reference.firstParseResult || finalParseResult;

      debug('final parsed argv: %O', parsedArgv);

      if (!parsedArgv) {
        throw new AssertionFailedError(ErrorMessage.AssertionFailureExistenceInvariant());
      }

      debug('entering execution epilogue...');

      const result = await configureExecutionEpilogue(parsedArgv, context);

      debug('execution epilogue returned: %O', result);

      if (!result) {
        throw new AssertionFailedError(
          ErrorMessage.AssertionFailureConfigureExecutionEpilogue()
        );
      }

      debug('final execution context: %O', asEnumerable(context));
      debug('execution complete');

      return result;
    } catch (error) {
      let argv: Parameters<typeof configureErrorHandlingEpilogue>[1];

      try {
        argv = (rootProgram.parsed || { argv: {} }).argv as unknown as typeof argv;
      } catch {
        argv = {} as typeof argv;
      }

      if (isGracefulEarlyExitError(error)) {
        debug.message('caught graceful early exit signal, terminating execution...');
        debug('argv at point of termination: %O', argv);
        // ? If we're exiting gracefully, that probably means argv is okay
        return argv as Arguments<Record<string, unknown>>;
      } else {
        const debug_error = debug.extend('catch');

        debug_error.error('caught fatal error (type %O): %O', typeof error, error);

        let message = ErrorMessage.Generic();
        let exitCode = FrameworkExitCode.DEFAULT_ERROR;

        if (typeof error === 'string') {
          message = error;
        } else if (isCliError(error)) {
          message = error.message;
          exitCode = error.suggestedExitCode;
        } else if (error) {
          message = `${error}`;
        }

        debug_error('final error message: %O', message);
        debug_error('final exit code: %O', exitCode);
        debug_error('semi-parsed argv (may be incomplete due to error state): %O', argv);

        if (!context.state.isSilenced) {
          log.error([IF_NOT_SILENCED], `❌ Execution failed: ${message}`);
          if (!context.state.isQuieted && isNativeError(error) && error.cause) {
            log.error([IF_NOT_QUIETED], '❌ Causal stack:');

            for (
              let count = 0, subError: Error | undefined = error;
              subError?.cause && count < MAX_LOG_ERROR_ENTRIES;
              count++
            ) {
              if (isNativeError(subError.cause)) {
                log.error([IF_NOT_QUIETED], ` 🠺 ${subError.cause.message}`);
                subError = subError.cause;
              } else {
                log.error([IF_NOT_QUIETED], ` 🠺 ${subError.cause}`);
                subError = undefined;
              }

              if (count + 1 >= MAX_LOG_ERROR_ENTRIES) {
                log.error([IF_NOT_QUIETED], `(remaining entries have been hidden)`);
              }
            }
          }

          if (!context.state.isHushed && taskManager.errors.length > 0) {
            log.newline([IF_NOT_HUSHED]);
            log.error([IF_NOT_HUSHED], '❌ Fatal task errors:');

            for (const taskError of taskManager.errors) {
              if (taskError.type !== ListrErrorTypes.HAS_FAILED_WITHOUT_ERROR) {
                log.error([IF_NOT_HUSHED], `❗ ${taskError.message}`);
              }
            }
          }
        }

        debug_error('entering error handling epilogue...');

        // ? Ensure [$executionContext] always exists
        argv[$executionContext] ??= asUnenumerable(context);

        await configureErrorHandlingEpilogue(error, argv, context);

        debug_error('error handling epilogue concluded');
        debug_error('final execution context: %O', asEnumerable);
        debug_error('error handling complete');

        throw error;
      }
    }
  };

  debug('configureProgram invocation succeeded');

  return {
    program: rootProgram,
    execute: parseAndExecuteWithErrorHandling,
    ...asEnumerable(context)
  };
}

/**
 * Returns a {@link Program} instance.
 *
 * This function is sugar for `return (await import('yargs/yargs')).default()`.
 *
 * The returned yargs instance has its magical ::argv property disabled via a
 * [this-recovering
 * proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#no_private_property_forwarding)
 * object.
 *
 * @internal
 */
export function makeProgram<RawArgs extends Record<string, unknown>>() {
  // ? Why go through all this trouble? Because, Jest likes to make "deep
  // ? cyclical copies" of objects from time to time. These deep copies
  // ? necessarily require recursively accessing every property of the object...
  // ? including magic properties like ::argv, which causes ::parse to be called
  // ? multiple times, which leads to undefined behavior and heisenbugs. Yuck.
  return new Proxy(yargs() as unknown as Program<RawArgs>, {
    get(target, property) {
      if (property === 'argv') {
        debug.warn(
          'trapped and killed attempted access to disabled ::argv magic property'
        );
        return undefined;
      }

      const value: unknown =
        // @ts-expect-error: TypeScript isn't smart enough to figure this out
        target[property];

      if (value instanceof Function) {
        return function (...args: unknown[]) {
          return value.apply(target, args);
        };
      }
      return value;
    }
  });
}

/**
 * Creates an object with a "hidden" `[$executionContext]`.
 *
 * @internal
 */
export function wrapExecutionContext(context: ExecutionContext) {
  return { [$executionContext]: context };
}

/**
 * Takes an object and rewrites its property descriptors so that its properties
 * are no longer enumerable. This leads to less needlessly-verbose object logs
 * in debug output.
 *
 * @internal
 */
export function asUnenumerable<T extends object>(context: T) {
  if (!context) {
    return context;
  }

  const unenumerableContext = {} as T;
  const allOwnKeys = (Object.getOwnPropertyNames(context) as (string | symbol)[]).concat(
    ...Object.getOwnPropertySymbols(context)
  );

  for (const key of allOwnKeys) {
    Object.defineProperty(unenumerableContext, key, {
      enumerable: false,
      configurable: true,
      // @ts-expect-error: TypeScript isn't smart enough to figure this out yet
      value: context[key],
      writable: true
    });
  }

  return unenumerableContext;
}

/**
 * Takes an object and rewrites its property descriptors so that its properties
 * are guaranteed enumerable. This is used when we actually do want to show
 * verbose object logs in debug output.
 *
 * @internal
 */
export function asEnumerable<T extends object>(context: T) {
  if (!context) {
    return context;
  }

  const enumerable = {} as T;
  const allOwnKeys = (Object.getOwnPropertyNames(context) as (string | symbol)[]).concat(
    ...Object.getOwnPropertySymbols(context)
  );

  for (const key of allOwnKeys) {
    Object.defineProperty(enumerable, key, {
      enumerable: true,
      configurable: true,
      // @ts-expect-error: TypeScript isn't smart enough to figure this out yet
      value: context[key],
      writable: true
    });
  }

  return enumerable;
}
