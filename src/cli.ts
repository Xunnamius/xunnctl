/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable unicorn/no-process-exit */
import { FrameworkExitCode } from 'universe/constant';
import { isCliError } from 'universe/error';

// ? Kill node warnings.
// ! Imports that might generate warnings must occur after this function is
// ! EXECUTED, which means using dynamic imports in this file.
// TODO: replace this with the lib function that does the same
process.removeAllListeners('warning');

/**
 * This is the simple CLI entry point executed directly by node.
 */
export default (async () => {
  const { configureProgram } = await import('universe/index');
  try {
    await (await configureProgram()).execute();
    process.exit(FrameworkExitCode.OK);
  } catch (error) {
    process.exit(
      isCliError(error) ? error.suggestedExitCode : FrameworkExitCode.DEFAULT_ERROR
    );
  }
})();
