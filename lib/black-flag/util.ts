/* eslint-disable unicorn/prefer-export-from */
// TODO: replace with appropriate exports entries in package.json

import { hideBin as hideBin_ } from 'yargs/helpers';

export { isCliError, isGracefulEarlyExitError } from 'multiverse/black-flag/src/error';
export { makeRunner } from 'multiverse/black-flag/src/util';

/**
 * @see https://yargs.js.org/docs/#api-reference
 */
export const hideBin = hideBin_;
