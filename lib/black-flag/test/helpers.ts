import path from 'node:path';

/**
 * Returns a `Program` instance's {@link PreExecutionContext}.
 */
export async function getProgram() {
  const preExecutionContext = await (
    await import('multiverse/black-flag')
  ).configureProgram();
  return preExecutionContext;
}

export function getFixturePath(fixture: string | string[]) {
  return path.join(__dirname, 'fixtures', ...[fixture].flat());
}

export function expectedCommandsRegex(
  childCommands: string[],
  parentFullName = 'xunnctl'
) {
  return new RegExp(
    'Commands:\\n\\s+' +
      parentFullName +
      '\\s+Description.*?\\s+\\[default]\\n' +
      childCommands
        .map((cmd) => '\\s+' + parentFullName + '\\s+' + cmd + '\\s+Description.*?\\n')
        .join('') +
      '\\n'
  );
}