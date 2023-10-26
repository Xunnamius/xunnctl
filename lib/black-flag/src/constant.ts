import type { Argv } from 'yargs';

/**
 * A symbol allowing access to the `ExecutionContext` object "hidden" within
 * each `Arguments` instance.
 */
export const $executionContext = Symbol('execution-context');

/**
 * Hard-coded default program `usage` text provided to yargs instances via
 * `.usage(...)`.
 */
export const DEFAULT_USAGE_TEXT = 'Usage: $0';

/**
 * These are `Program` instance properties that will throw an
 * `AssertionFailedError` upon invocation invoked if and only if said program is
 * not a shadow clone.
 */
export const DISALLOWED_NON_SHADOW_PROGRAM_METHODS: readonly (keyof Argv)[] = [
  'strict',
  'strictCommands',
  'strictOptions'
];

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
