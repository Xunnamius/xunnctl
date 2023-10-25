import { isNativeError } from 'node:util/types';

import { ListrErrorTypes } from 'listr2';
import { name as pkgName } from 'package';
import { hideBin } from 'yargs/helpers';

import {
  createGenericLogger,
  createListrManager,
  type ExtendedLogger,
  type ListrManager
} from 'multiverse/rejoinder';

import { LogTag, MAX_LOG_ERROR_ENTRIES } from 'universe/constant';

import type {
  ConfigureArguments,
  ConfigureErrorHandlingEpilogue,
  ConfigureExecutionContext,
  ExecutionContext
} from 'multiverse/black-flag';

const { IF_NOT_SILENCED, IF_NOT_QUIETED, IF_NOT_HUSHED } = LogTag;
const rootGenericLogger = createGenericLogger({ namespace: pkgName });

export type CustomExecutionContext = ExecutionContext & {
  /**
   * The {@link ExtendedLogger} for the current runtime level.
   */
  log: ExtendedLogger;
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
  };
};

export const configureExecutionContext: ConfigureExecutionContext<
  CustomExecutionContext
> = (context) => {
  return {
    ...context,
    log: rootGenericLogger,
    taskManager: createListrManager(),
    state: {
      ...context.state,
      isSilenced: false,
      isQuieted: false,
      isHushed: false
    }
  };
};

export const configureArguments: ConfigureArguments = (rawArgv) => {
  return hideBin(rawArgv);
};

export const configureErrorHandlingEpilogue: ConfigureErrorHandlingEpilogue<
  CustomExecutionContext
> = async ({ error, message }, _argv, context) => {
  if (!context.state.isSilenced) {
    context.log.error([IF_NOT_SILENCED], `❌ Execution failed: ${message}`);
    if (
      !context.state.isQuieted &&
      isNativeError(error) &&
      error.cause &&
      // ? Don't repeat what has already been output
      error.cause !== message
    ) {
      context.log.error([IF_NOT_QUIETED], '❌ Causal stack:');

      for (
        let count = 0, subError: Error | undefined = error;
        subError?.cause && count < MAX_LOG_ERROR_ENTRIES;
        count++
      ) {
        if (isNativeError(subError.cause)) {
          context.log.error([IF_NOT_QUIETED], ` ⮕  ${subError.cause.message}`);
          subError = subError.cause;
        } else {
          context.log.error([IF_NOT_QUIETED], ` ⮕  ${subError.cause}`);
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
          context.log.error([IF_NOT_HUSHED], `❗ ${taskError.message}`);
        }
      }
    }
  }
};
