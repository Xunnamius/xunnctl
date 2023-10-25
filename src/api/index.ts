import debugFactory from 'debug';

import { API_TOKEN, API_URI_BASE } from './env.mjs';
import { createLogger } from './rejoinder.mjs';

// TODO: replace debug with debug-extended
const debug = debugFactory('ergo-cf:lib:fetch:debug');
const { message: logMessage, error: logError } = createLogger('ergo-cf:lib:fetch');

/**
 * - https://developers.cloudflare.com/api
 *
 * @param {string} uri
 * @param {string} method
 * @param {Record<string, unknown>} body
 * @param {RequestInit} [additionalOptions]
 * @returns {Promise<[result: unknown, rawResponseJson: Record<string, unknown>]>}
 */
export async function makeApiCall(uri, method, body, additionalOptions) {
  debug('request uri: %O', uri);
  debug('request method: %O', method);
  debug('request body: %O', body);
  debug('request additionalOptions: %O', additionalOptions);

  /**
   * @type {RequestInit}
   */
  const baseOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${API_TOKEN}`
    }
  };

  const res = await fetch(`${API_URI_BASE}/${uri}`, {
    ...baseOptions,
    ...additionalOptions,
    body: JSON.stringify(body)
  });

  debug('request url: %O', res.url);
  debug('response status: %O', res.status);
  debug('response status text: %O', res.statusText);
  debug('response headers: %O', res.headers);

  const responseBody = await res.text();

  debug('response body (expecting JSON): %O', responseBody);

  const responseJson = JSON.parse(responseBody);
  const { success, errors, result, messages } = responseJson;

  if (messages.length) {
    messages.forEach((message) => logMessage(message));
  }

  if (!success) {
    if (errors?.length) {
      errors.forEach(({ code, message }) => logError(`[${code}]: ${message}\n`));
    } else {
      logError('(request failed but no error message was returned)');
    }

    throw new Error('terminated due to reported API error');
  }

  return [result, responseJson];
}
