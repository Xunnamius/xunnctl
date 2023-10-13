/* eslint-disable unicorn/no-process-exit */
import { ListrErrorTypes } from 'listr2';
import { TAB } from 'multiverse/rejoinder';

// ? Kill node warnings.
// ! Imports that might generate warnings must occur after this function is
// ! EXECUTED, which means using dynamic imports (mainModule) in this file.
// TODO: replace this with the lib function that does the same
process.removeAllListeners('warning');

export default (({
  program,
  parse,
  log,
  debug,
  taskManager,
  state: { isSilenced, isQuieted, isHushed }
}) => {
  return parse().catch(async (error: unknown) => {
    debug.error('processing fatal error (%s): %O', typeof error, error);

    const { isNativeError } = await import('node:util/types');
    const { isCliError } = await import('universe/error');
    const {
      LogTag: { IF_NOT_SILENCED, IF_NOT_QUIETED, IF_NOT_HUSHED },
      MAX_LOG_ERROR_ENTRIES
    } = await import('universe/index');

    let message = 'an error occurred that caused this software to crash';
    let exitCode = 0;

    if (typeof error === 'string') {
      message = error;
    } else if (isCliError(error)) {
      message = error.message;
      exitCode = error.suggestedExitCode;
    } else if (error) {
      message = `${error}`;
    }

    debug.error('final error message: %O', message);
    debug.error('final exit code: %O', exitCode);

    const argv = await program.argv;

    debug.error('final argv during error: %O', argv);

    if (!isSilenced) {
      log.error([IF_NOT_SILENCED], `❌ Execution failed: ${message}`);
      if (!isQuieted && isNativeError(error) && error.cause) {
        log.error([IF_NOT_QUIETED], '❌ Causal stack:');

        for (
          let count = 0, subError: Error | undefined = error;
          subError?.cause && count < MAX_LOG_ERROR_ENTRIES;
          count++
        ) {
          if (isNativeError(subError.cause)) {
            log.error([IF_NOT_QUIETED], `${TAB}- ${subError.cause.message}`);
            subError = subError.cause;
          } else {
            log.error([IF_NOT_QUIETED], `${TAB}- ${subError.cause}`);
            subError = undefined;
          }

          if (count + 1 >= MAX_LOG_ERROR_ENTRIES) {
            log.error([IF_NOT_QUIETED], `${TAB}(remaining entries have been hidden)`);
          }
        }
      }

      if (!isHushed && taskManager.errors.length > 0) {
        log.newline([IF_NOT_HUSHED]);
        log.error([IF_NOT_HUSHED], '❌ Fatal task errors:');

        for (const taskError of taskManager.errors) {
          if (taskError.type !== ListrErrorTypes.HAS_FAILED_WITHOUT_ERROR) {
            log.error([IF_NOT_HUSHED], `❗ ${taskError.message}`);
          }
        }
      }
    }

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(exitCode);
  });

  // ? Why split this into two files like this? Several reasons, including
  // ? that process.removeAllListeners won't be called soon enough for static
  // ? imports.
})((await import('universe/index')).configureProgram());
