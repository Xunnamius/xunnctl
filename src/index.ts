import assert from 'node:assert';
import { isNativeError } from 'node:util/types';

import alphaSort from 'alpha-sort';
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

  debug('entering configureExecutionContext');

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

  debug('exited configureExecutionContext');
  debug('configured execution context: %O', asEnumerable(context));

  if (!context) {
    throw new CliError(ErrorMessage.InvalidConfigureExecutionContextReturnType());
  }

  debug.message(
    'to save space, ExecutionContext will be unenumerable from this point on'
  );

  const deepestParseResultWrapper = await discoverCommands(
    CONFIG_MODULES_ROOT_PATH,
    rootProgram,
    context
  );

  debug('entering configureExecutionPrologue');

  configureExecutionPrologue(rootProgram, context);

  debug('exited configureExecutionPrologue');

  const parseAndExecuteWithErrorHandling: Executor = async (argv_) => {
    debug('execute was invoked');

    try {
      debug('raw argv: %O', argv_);

      debug('entering configureArguments');

      const argv: typeof process.argv | undefined = configureArguments(
        argv_?.length ? argv_ : process.argv,
        context
      );

      debug('exited configureArguments');

      if (!Array.isArray(argv)) {
        throw new AssertionFailedError(
          ErrorMessage.InvalidConfigureArgumentsReturnType()
        );
      }

      debug('configured argv (initialRawArgv): %O', argv);

      context.state.rawArgv = argv;

      const shallowestParseResult = await rootProgram.parseAsync(
        argv,
        wrapExecutionContext(context)
      );

      // ? If commands were auto-discovered, a handler was likely executed. ?
      // ? Return the result from the handler of the deepest command. If no
      // ? commands were auto-discovered, then return as is the result of
      // ? calling `parseAsync` on the root program.
      const finalArgv = deepestParseResultWrapper.result || shallowestParseResult;

      debug('final parsed argv: %O', finalArgv);

      if (!finalArgv) {
        throw new AssertionFailedError(ErrorMessage.AssertionFailureExistenceInvariant());
      }

      debug('entering configureExecutionEpilogue');

      const result = await configureExecutionEpilogue(finalArgv, context);

      debug('exited configureExecutionEpilogue');
      debug('execution epilogue returned: %O', result);

      if (!result) {
        throw new AssertionFailedError(
          ErrorMessage.AssertionFailureConfigureExecutionEpilogue()
        );
      }

      debug('final execution context: %O', asEnumerable(context));
      debug('execution complete');
      debug.newline();

      return result;
    } catch (error) {
      let argv: Parameters<typeof configureErrorHandlingEpilogue>[1];

      try {
        argv = (rootProgram.parsed || { argv: {} }).argv as unknown as typeof argv;
      } catch {
        argv = {} as typeof argv;
      }

      if (isGracefulEarlyExitError(error)) {
        debug.message('caught graceful early exit "error"');
        debug.warn('error will be forwarded to top-level error handler');
        debug('argv at point of termination: %O', argv);

        throw error;
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
          if (
            !context.state.isQuieted &&
            isNativeError(error) &&
            error.cause &&
            // ? Don't repeat what has already been output
            error.cause !== message
          ) {
            log.error([IF_NOT_QUIETED], '❌ Causal stack:');

            for (
              let count = 0, subError: Error | undefined = error;
              subError?.cause && count < MAX_LOG_ERROR_ENTRIES;
              count++
            ) {
              if (isNativeError(subError.cause)) {
                log.error([IF_NOT_QUIETED], ` ⮕  ${subError.cause.message}`);
                subError = subError.cause;
              } else {
                log.error([IF_NOT_QUIETED], ` ⮕  ${subError.cause}`);
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

        debug_error('entering configureErrorHandlingEpilogue');

        // ? Ensure [$executionContext] always exists
        argv[$executionContext] ??= asUnenumerable(context);

        await configureErrorHandlingEpilogue(error, argv, context);

        debug_error('exited configureErrorHandlingEpilogue');
        debug_error('final execution context: %O', asEnumerable);
        debug_error('error handling complete');
        debug_error.newline();

        throw error;
      }
    }
  };

  debug('finalizing deferred command registrations');

  context.commands.forEach((wrapper) => wrapper.program.command_finalize_deferred());

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
 * Among other things, this function is sugar for `return (await
 * import('yargs/yargs')).default()`.
 *
 * The returned yargs instance has its magical `::argv` property disabled via a
 * [this-recovering
 * proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#no_private_property_forwarding)
 * object. The instance also exposes two new methods: `command_deferred` and
 * `command_finalize_deferred`.
 *
 * @internal
 */
export function makeProgram<RawArgs extends Record<string, unknown>>() {
  const debug_ = debug.extend('make');
  const deferredCommandArgs: Parameters<Program<RawArgs>['command']>[] = [];

  debug_('created new Program instance');

  return new Proxy(yargs() as unknown as Program<RawArgs>, {
    get(target, property) {
      if (property === 'argv') {
        debug_.warn(
          'trapped and killed attempted access to disabled ::argv magic property'
        );

        // ? Why go through all this trouble? Because, Jest likes to make "deep
        // ? cyclical copies" of objects from time to time, especially WHEN
        // ? ERRORS ARE THROWN. These deep copies necessarily require
        // ? recursively accessing every property of the object... including
        // ? magic properties like ::argv, which causes ::parse to be called
        // ? multiple times AFTER AN ERROR ALREADY OCCURRED, which leads to
        // ? undefined behavior and heisenbugs. Yuck.
        return undefined;
      }

      // ? And what are command_deferred and command_finalize_deferred? Well,
      // ? when generating help text, yargs will enumerate commands and options
      // ? in the order that they were added to the instance. Unfortunately,
      // ? since we're relying on the filesystem to asynchronously reveal its
      // ? contents to us, commands will be added in unpredictable OS-specific
      // ? orders. We don't like that, we want our commands to always appear in
      // ? the same order no matter what OS the CLI is invoked on. So, we
      // ? replace ::command with ::command_deferred, which adds its parameters
      // ? to an internal list, and ::command_finalize_deferred, which sorts
      // ? said list and enumerates the result, calling the real ::command as it
      // ? goes. As for preserving the sort order of options within the builder
      // ? function, that's an exercise left to the end developer :)

      if (property === 'command_deferred') {
        return function (...args: Parameters<Program<RawArgs>['command']>) {
          debug_('::command call was deferred');
          deferredCommandArgs.push(args);
          return target;
        };
      }

      if (property === 'command_finalize_deferred') {
        return function () {
          debug_('began alpha-sorting deferred command calls');

          // ? Sort in alphabetical order with naturally sorted numbers
          const sort = alphaSort({ natural: true });

          deferredCommandArgs.sort(([firstCommands], [secondCommands]) => {
            const firstCommand = firstCommands[0];
            const secondCommand = secondCommands[0];

            // ? If they do, then we accidentally called this on a child instead
            // ? of a parent...
            assert(!firstCommand.startsWith('$0'));
            assert(!secondCommand.startsWith('$0'));

            return sort(firstCommand, secondCommand);
          });

          debug_(
            'calling ::command with %O deferred argument tuples...',
            deferredCommandArgs.length
          );

          for (const args of deferredCommandArgs) {
            target.command(...args);
          }
        };
      }

      const value: unknown =
        // @ts-expect-error: TypeScript isn't smart enough to figure this out
        target[property];

      if (value instanceof Function) {
        return function (...args: unknown[]) {
          // ? "this-recovering" code
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
