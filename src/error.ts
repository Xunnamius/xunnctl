import { ErrorMessage as UpstreamErrorMessage } from 'multiverse/black-flag';

export {
  $type,
  AssertionFailedError,
  CliError,
  CommandNotImplementedError,
  GracefulEarlyExitError,
  isCliError,
  isGracefulEarlyExitError,
  type CliErrorOptions
} from 'multiverse/black-flag';

/**
 * A collection of possible error and warning messages.
 */
/* istanbul ignore next */
export const ErrorMessage = {
  ...UpstreamErrorMessage
};
