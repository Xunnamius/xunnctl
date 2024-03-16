import { ExtendedDebugger } from 'multiverse/debug-extended';
import { JsonValue } from 'type-fest';

/**
 * Generic fetch wrapper for making API calls.
 */
export async function makeApiCall({
  debug: debug_,
  uri,
  method,
  body,
  ...additionalOptions
}: { debug: ExtendedDebugger; uri: string; body?: JsonValue } & Omit<
  RequestInit,
  'body'
> & {
    [additionalOption: string]: unknown;
  }): Promise<[response: Response, responseBody: string]> {
  const debug = debug_.extend('makeApiCall');

  debug('request uri: %O', uri);
  debug('request method: %O', method);
  debug('request body: %O', body);
  debug('request additionalOptions: %O', additionalOptions);

  const res = await fetch(uri, {
    method,
    ...additionalOptions,
    body: JSON.stringify(body)
  });

  debug('request url: %O', res.url);
  debug('response status: %O', res.status);
  debug('response status text: %O', res.statusText);
  debug('response headers: %O', res.headers);

  const responseBody = await res.text();

  debug('response body: %O', responseBody);

  return [res, responseBody];
}
