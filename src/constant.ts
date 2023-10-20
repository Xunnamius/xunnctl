import path from 'node:path';

// ? Used in exported comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ExtendedLogger } from 'multiverse/rejoinder';

/**
 * A symbol allowing access to the `ExecutionContext` object hidden within
 * resultant `Arguments` objects returned by yargs instances.
 */
export const $executionContext = Symbol('execution-context');

/**
 * Hard-coded maximum reporting depth of the causal stack when fatal errors
 * occur.
 */
export const MAX_LOG_ERROR_ENTRIES = 10;

/**
 * Hard-coded absolute path of the directory containing the root program
 * configuration and any other child commands.
 *
 * Most projects should set this to `path.join(__dirname, 'command')`.
 */
export const CONFIG_MODULES_ROOT_PATH = path.join(__dirname, 'command');

/**
 * Hard-coded default program `usage` text provided to yargs instances via
 * `.usage(...)`.
 */
export const DEFAULT_USAGE_TEXT = 'Usage: $0';

/**
 * Well-known {@link ExtendedLogger} tags for filtering output automatically
 * depending on program state.
 */
export enum LogTag {
  IF_NOT_SILENCED = 'lens-cli:if-not-silenced',
  IF_NOT_QUIETED = 'lens-cli:if-not-quieted',
  IF_NOT_HUSHED = 'lens-cli:if-not-hushed'
}

/**
 * Well-known exit codes shared across CLI implementations.
 */
export enum FrameworkExitCode {
  /**
   * The exit code used when execution succeeds and exits gracefully.
   */
  OK = 0,
  /**
   * Hard-coded default fallback exit code when fatal errors occur.
   */
  DEFAULT_ERROR = 1,
  /**
   * The exit code used when executing an unimplemented child program.
   */
  NOT_IMPLEMENTED = 2,
  /**
   * The exit code used when a sanity check fails.
   */
  ASSERTION_FAILED = 3
}
