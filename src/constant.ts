// ? Used in exported comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ExtendedLogger } from 'multiverse/rejoinder';

/**
 * Hard-coded maximum reporting depth of the causal stack when fatal errors
 * occur.
 */
export const MAX_LOG_ERROR_ENTRIES = 10;

/**
 * Well-known {@link ExtendedLogger} tags for filtering output automatically
 * depending on program state.
 */
export enum LogTag {
  IF_NOT_SILENCED = 'lens-cli:if-not-silenced',
  IF_NOT_QUIETED = 'lens-cli:if-not-quieted',
  IF_NOT_HUSHED = 'lens-cli:if-not-hushed'
}
