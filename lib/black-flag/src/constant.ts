/**
 * A symbol allowing access to the `ExecutionContext` object hidden within
 * resultant `Arguments` objects returned by yargs instances.
 */
export const $executionContext = Symbol('execution-context');

/**
 * Hard-coded default program `usage` text provided to yargs instances via
 * `.usage(...)`.
 */
export const DEFAULT_USAGE_TEXT = 'Usage: $0';

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
