/**
 * Generate standard command usage text.
 * @internal
 */
export function makeUsageString(altDescription = '$1.') {
  if (altDescription?.endsWith('.') === false) {
    altDescription += '.';
  }

  return `Usage: $000\n\n${altDescription}`.trim();
}
