import { ExtendedDebugger } from 'multiverse/debug-extended';
import { JsonValue } from 'type-fest';

/**
 * Returns a generic fetch wrapper for making API calls.
 */
export function makeApiCaller({ debug: debug_ }: { debug: ExtendedDebugger }) {
  return async function ({
    uri,
    method,
    body,
    ...additionalOptions
  }: { uri: string; body?: JsonValue } & Omit<RequestInit, 'body'> & {
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
  };
}
