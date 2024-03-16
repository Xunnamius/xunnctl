import { JsonValue } from 'type-fest';

/**
 * Available configuration keys and their value types.
 */
export type Config = {
  // TODO
};

/**
 * Generate standard command usage text.
 */
export function makeUsageString(altDescription = '$1.') {
  if (altDescription?.endsWith('.') === false) {
    altDescription += '.';
  }

  return `Usage: $000\n\n${altDescription}`.trim();
}

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
  key: string;
}) {
  void configPath, key;
}

/**
 * Accepts a key-value pair, serializes it as JSON, and appends/overwrites the
 * result into a JSON configuration file.
 */
export async function saveToCliConfig({
  configPath,
  key,
  value
}: {
  configPath: string;
  key: string;
  value: JsonValue;
}) {
  void configPath, key, value;
}
