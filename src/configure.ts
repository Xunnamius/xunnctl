import { isNativeError } from 'node:util/types';

import { ListrErrorTypes } from 'listr2';

import {
  createDebugLogger,
  createGenericLogger,
  createListrManager,
  ExtendedDebugger,
  type ExtendedLogger,
  type ListrManager
} from 'multiverse/rejoinder';

import {
  debuggerNamespace,
  loggerNamespace,
  LogTag,
  MAX_LOG_ERROR_ENTRIES
} from 'universe/constant';

import type {
  ConfigureErrorHandlingEpilogue,
  ConfigureExecutionContext
} from '@black-flag/core';

import type { ExecutionContext } from '@black-flag/core/util';

const { IF_NOT_SILENCED, IF_NOT_QUIETED, IF_NOT_HUSHED } = LogTag;
const rootGenericLogger = createGenericLogger({ namespace: loggerNamespace });
const rootDebugLogger = createDebugLogger({ namespace: debuggerNamespace });

export type CustomExecutionContext = ExecutionContext & {
  /**
   * The {@link ExtendedLogger} for the CLI.
   */
  log: ExtendedLogger;
  /**
   * The {@link ExtendedDebugger} for the CLI.
   */
  debug_: ExtendedDebugger;
  /**
   * The global Listr task manager singleton.
   */
  taskManager: ListrManager;
  state: {
    /**
     * If `true`, the program should not output anything at all. It also implies
     * `isQuieted` and `isHushed` are both `true`.
     */
    isSilenced: boolean;
    /**
     * If `true`, the program should be dramatically less verbose. It also
     * implies `isHushed` is `true`.
     */
    isQuieted: boolean;
    /**
     * If `true`, the program should output only the most pertinent information.
     */
    isHushed: boolean;
    /**
     * A `Date` object representing the start time of execution.
     */
    startTime: Date;
  };
};

export const configureExecutionContext: ConfigureExecutionContext = (context) => {
  return {
    ...context,
    log: rootGenericLogger,
    debug_: rootDebugLogger,
    taskManager: createListrManager(),
    state: {
      ...context.state,
      isSilenced: false,
      isQuieted: false,
      isHushed: false,
      startTime: new Date()
    }
  };
};

export const configureErrorHandlingEpilogue: ConfigureErrorHandlingEpilogue<
  CustomExecutionContext
> = async (
  ...[{ message, error }, _argv, context]: Parameters<
    ConfigureErrorHandlingEpilogue<CustomExecutionContext>
  >
) => {
  // ? Pretty print error output depending on how silent we're supposed to be
  if (!context.state.isSilenced) {
    if (context.state.didOutputHelpOrVersionText) {
      context.log.newline([IF_NOT_SILENCED], 'alternate');
    }

    context.log.error([IF_NOT_SILENCED], `❌ Execution failed: ${message}`);

    if (
      !context.state.isQuieted &&
      isNativeError(error) &&
      error.cause &&
      // ? Don't repeat what has already been output
      error.cause !== message
    ) {
      for (
        let count = 0, subError: Error | undefined = error;
        subError?.cause && count < MAX_LOG_ERROR_ENTRIES;
        count++
      ) {
        if (isNativeError(subError.cause)) {
          if (count === 0) {
            if (!subError.cause.cause) {
              break;
            }

            context.log.error([IF_NOT_QUIETED], '❌ Causal stack:');
          }

          context.log.error([IF_NOT_QUIETED], `   ⮕  ${subError.cause.message}`);
          subError = subError.cause;
        } else {
          context.log.error([IF_NOT_QUIETED], `   ⮕  ${subError.cause}`);
          subError = undefined;
        }

        if (count + 1 >= MAX_LOG_ERROR_ENTRIES) {
          context.log.error([IF_NOT_QUIETED], `(remaining entries have been hidden)`);
        }
      }
    }

    if (!context.state.isHushed && context.taskManager.errors.length > 0) {
      context.log.newline([IF_NOT_HUSHED]);
      context.log.error([IF_NOT_HUSHED], '❌ Fatal task errors:');

      for (const taskError of context.taskManager.errors) {
        if (taskError.type !== ListrErrorTypes.HAS_FAILED_WITHOUT_ERROR) {
          context.log.error([IF_NOT_HUSHED], `   ❗ ${taskError.message}`);
        }
      }
    }
  }
};
