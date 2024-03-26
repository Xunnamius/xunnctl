import { readFile, writeFile } from 'node:fs/promises';
import { JsonValue, LiteralUnion } from 'type-fest';
import { ErrorMessage } from 'universe/error';

let cache: Config | undefined = undefined;

/**
 * Available configuration keys and their value types.
 */
export type Config = {
  /**
   * Cloudflare API base URI. For example: https://api.cloudflare.com/client/v4
   */
  cfApiUriBase: string;
  /**
   * Cloudflare API token.
   */
  cfApiToken: string;
  /**
   * Cloudflare account token.
   */
  cfAccountId: string;
  /**
   * Cloudflare hostile IP blocking rule name.
   */
  cfWafBlockHostileIpRuleName: string;
  /**
   * Cloudflare hostile IP blocking list name.
   */
  cfWafBlockHostileIpListName: string;
  /**
   * Cloudflare firewall phase name.
   */
  cfFirewallPhaseName: string;
  /**
   * The ID of the primary zone where, for instance, ban lists and email-related
   * configurations are stored.
   */
  cfMainZoneId: string;
  /**
   * Cloudflare hostile IP blocking list ID.
   */
  cfHostileIpListId: string;
  /**
   * DigitalOcean API base URI. For example: https://api.digitalocean.com/v2
   */
  doApiUriBase: string;
  /**
   * DigitalOcean API token.
   */
  doApiToken: string;
};

/**
 * Loads and caches a JSON configuration file and returns a key, if available.
 * If the key is not available, either a default value or `undefined` is
 * returned.
 */
export async function loadFromCliConfig({
  configPath,
  key
}: {
  configPath: string;
  key: LiteralUnion<keyof Config, string>;
}): Promise<JsonValue>;
export async function loadFromCliConfig({
  configPath,
  key
}: {
  configPath: string;
  key?: undefined;
}): Promise<Config>;
export async function loadFromCliConfig({
  configPath,
  key
}: {
  configPath: string;
  key?: keyof Config | string;
}) {
  const config: Config = await (async () => {
    if (cache !== undefined) {
      return cache;
    }

    try {
      return JSON.parse(
        await readFile(configPath, { encoding: 'utf8' }).catch(() => '{}')
      );
    } catch (error) {
      throw new Error(ErrorMessage.ConfigLoadFailure(configPath), { cause: error });
    }
  })();

  cache = config;

  if (key === undefined) {
    return config;
  }

  const value = config[key as keyof Config] as Config[keyof Config] | undefined;

  if (value === undefined) {
    throw new Error(ErrorMessage.MissingConfigurationKey(key));
  }

  return value;
}

/**
 * Accepts a key-value pair, serializes it as JSON, and appends/overwrites the
 * result into a JSON configuration file while updating the cache.
 */
export async function saveToCliConfig({
  configPath,
  key,
  value
}: {
  configPath: string;
  key: LiteralUnion<keyof Config, string>;
  value: JsonValue | undefined;
}) {
  const config = cache !== undefined ? cache : await loadFromCliConfig({ configPath });

  if (value === undefined) {
    // @ts-expect-error: if the user screws this up, that's on them
    delete config[key];
  } else {
    // @ts-expect-error: if the user screws this up, that's on them
    config[key] = value;
  }

  try {
    return await writeFile(configPath, JSON.stringify(config), {
      encoding: 'utf8',
      mode: 0o660
    });
  } catch (error) {
    throw new Error(ErrorMessage.ConfigSaveFailure(), { cause: error });
  }
}

/**
 * Overwrites the current configuration cache. Useful while testing.
 */
export async function setCache(replacementCache: typeof cache) {
  cache = replacementCache;
}
