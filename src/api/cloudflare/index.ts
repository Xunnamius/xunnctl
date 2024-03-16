import { ExtendedLogger } from 'multiverse/rejoinder';
import { makeApiCall } from 'universe/api';
import { LogTag } from 'universe/constant';
import { loadFromCliConfig } from 'universe/util';

/**
 * - https://developers.cloudflare.com/api
 *
 * Cloudflare-specific fetch wrapper for making API calls.
 */
export async function makeCloudflareApiCall({
  configPath,
  log,
  ...makeApiCallArgs
}: { configPath: string; log: ExtendedLogger } & Parameters<
  typeof makeApiCall
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
>[0]): Promise<[result: any, responseJson: any]> {
  const { message: logMessage, error: logError } = log.extend('api:cf');

  const apiUriBase = await loadFromCliConfig({ configPath, key: 'cfApiUriBase' });
  const apiToken = await loadFromCliConfig({ configPath, key: 'cfApiToken' });

  const headers = new Headers(makeApiCallArgs.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `bearer ${apiToken}`);

  makeApiCallArgs.uri = `${apiUriBase}/${makeApiCallArgs.uri}`;
  makeApiCallArgs.headers = headers;

  const [, responseBody] = await makeApiCall(makeApiCallArgs);

  const responseJson = JSON.parse(responseBody);
  const { success, errors, result, messages } = responseJson;

  if (messages.length) {
    messages.forEach((message: string) => logMessage([LogTag.IF_NOT_HUSHED], message));
  }

  if (!success) {
    if (Array.isArray(errors) && errors?.length) {
      errors.forEach(({ code, message }) =>
        logError([LogTag.IF_NOT_SILENCED], `[${code}]: ${message}\n`)
      );
    } else {
      logError(
        [LogTag.IF_NOT_SILENCED],
        '(request failed but no error message was returned)'
      );
    }

    throw new Error('terminated due to reported API error');
  }

  return [result, responseJson];
}
