// ? Used in exported comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ExtendedLogger } from 'multiverse/rejoinder';

/**
 * Hard-coded maximum reporting depth of the causal stack when fatal errors
 * occur.
 */
export const MAX_LOG_ERROR_ENTRIES = 10;

/**
 * The CLI-wide namespace that appears in logger output.
 */
export const loggerNamespace = 'xctl';

/**
 * The CLI-wide namespace that appears in debugger output.
 */
export const debuggerNamespace = 'xunnctl';

/**
 * Nginx configuration custom autogenerated section topmatter.
 */
export const nginxConfigTopMatter = '### START AUTOGENERATED RULES';

/**
 * Nginx configuration custom autogenerated section bottommatter.
 */
export const nginxConfigBottomMatter = '### END AUTOGENERATED RULES';

/**
 * The success message commands should output when a command succeeds.
 */
export const standardSuccessMessage = '✅ Succeeded!';

/**
 * Well-known {@link ExtendedLogger} tags for filtering output automatically
 * depending on program state.
 */
export enum LogTag {
  IF_NOT_SILENCED = 'lens-cli:if-not-silenced',
  IF_NOT_QUIETED = 'lens-cli:if-not-quieted',
  IF_NOT_HUSHED = 'lens-cli:if-not-hushed'
}
