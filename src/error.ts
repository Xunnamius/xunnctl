import { ErrorMessage as UpstreamErrorMessage } from '@black-flag/core/util';

/**
 * A collection of possible error and warning messages.
 */
/* istanbul ignore next */
export const ErrorMessage = {
  ...UpstreamErrorMessage,
  MissingConfigurationKey(key: string) {
    return `missing configuration key "${key}". Use the 'xunnctl config set' command to add it`;
  },
  ConfigSaveFailure() {
    return 'failed to commit configuration changes to filesystem';
  },
  FailedCloudflareIpFetch() {
    return 'failed to fetch Cloudflare IPs';
  },
  MissingOneOfSeveralOptions(givenOptions: Record<string, unknown>) {
    const possibleOptions = Object.keys(givenOptions);
    return `one of the following options must be provided: ${possibleOptions.join(', ')}`;
  }
};
