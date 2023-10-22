import path from 'node:path';

import type { Arguments, PreExecutionContext } from 'types/global';
import { isGracefulEarlyExitError } from 'universe/error';

/**
 * Returns a `Program` instance's {@link PreExecutionContext}.
 */
export async function getProgram() {
  const preExecutionContext = await (await import('universe/index')).configureProgram();
  return preExecutionContext;
}

/**
 * Accepts an argument string and executes the program present in the given
 * {@link PreExecutionContext}, if provided, or in the return value of
 * {@link getProgram} if not.
 */
export async function runProgram<
  CmdArgs extends Record<string, unknown> = Record<string, unknown>
>(argv: string, preExecutionContext?: PreExecutionContext): Promise<Arguments<CmdArgs>>;
/**
 * Accepts an argument string array and executes a program present in the given
 * {@link PreExecutionContext}, if provided, or in the return value of
 * {@link getProgram} if not.
 */
export async function runProgram<
  CmdArgs extends Record<string, unknown> = Record<string, unknown>
>(argv: string[], preExecutionContext?: PreExecutionContext): Promise<Arguments<CmdArgs>>;
/**
 * Accepts an argument string or string array and executes a program present in
 * the given {@link PreExecutionContext}, if provided, or in the return value of
 * {@link getProgram} if not.
 */
// ? https://stackoverflow.com/a/77211900/1367414
export async function runProgram<
  CmdArgs extends Record<string, unknown> = Record<string, unknown>
>(
  argv: string | string[],
  preExecutionContext?: PreExecutionContext
): Promise<Arguments<CmdArgs>>;
export async function runProgram<
  CmdArgs extends Record<string, unknown> = Record<string, unknown>
>(
  argv: string | string[],
  preExecutionContext?: PreExecutionContext
): Promise<Arguments<CmdArgs>> {
  const context = preExecutionContext || (await getProgram());

  try {
    return (await context.execute(
      Array.isArray(argv) ? argv : argv.split(' ')
    )) as Arguments<CmdArgs>;
  } catch (error) {
    if (isGracefulEarlyExitError(error)) {
      // ? Replicate a little bit of cli.ts functionality here, and alter
      // ? downstream testing code that this is what we're doing now
      const argv = (context.program.parsed || { argv: {} }).argv as Arguments<CmdArgs>;
      return Object.assign(argv, { $gracefulExit: true });
    }

    throw error;
  }
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
