import { isNativeError } from 'node:util/types';

import {
  AppError,
  ErrorMessage as NamedErrorMessage,
  makeNamedError
} from 'named-app-errors';

export * from 'named-app-errors';

// TODO: replace a lot of all that follows with the official package(s),
// TODO: including the symbol use

export const $type = Symbol.for('object-type-hint');

export function isCliError(parameter: unknown): parameter is CliError {
  return (
    isNativeError(parameter) && $type in parameter && parameter[$type] === CliError.name
  );
}

/**
 * Options available when constructing a new `CliError` object.
 */
export type CliErrorOptions = {
  /**
   * The exit code that will be returned when the program exits, given nothing
   * else goes wrong in the interim.
   *
   * @default 0
   */
  suggestedExitCode?: number;
};

/**
 * Represents a CLI-specific error with suggested exit code and other
 * properties. As `CliError` has built-in support for cause chaining, this class
 * can be used as a simple wrapper around other errors.
 */
// TODO: this should use the new type of more-generic error from the new version
// TODO: of the X-app-errors pages
export class CliError extends AppError implements NonNullable<CliErrorOptions> {
  suggestedExitCode = 0;
  // TODO: this prop should be added by makeNamedError or whatever other fn
  [$type] = 'CliError';
  /**
   * Represents a CLI-specific error, optionally with suggested exit code and
   * other context.
   */
  constructor(cause: Error | string, options?: CliErrorOptions);
  /**
   * This constructor syntax is used by subclasses when calling this constructor
   * via `super`.
   */
  constructor(
    cause: Error | string,
    options: CliErrorOptions,
    message: string,
    superOptions: ErrorOptions
  );
  constructor(
    cause: Error | string,
    { suggestedExitCode }: CliErrorOptions = {},
    message: string | undefined = undefined,
    superOptions: ErrorOptions = {}
  ) {
    super(message ?? (typeof cause === 'string' ? cause : cause.message), {
      cause,
      ...superOptions
    });

    if (suggestedExitCode !== undefined) {
      this.suggestedExitCode = suggestedExitCode;
    }
  }
}
makeNamedError(CliError, 'CliError');

/**
 * A collection of possible error and warning messages.
 */
/* istanbul ignore next */
export const ErrorMessage = {
  ...NamedErrorMessage
};
