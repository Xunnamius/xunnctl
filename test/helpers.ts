import path from 'node:path';

import { withMockedArgv, withMockedExit, withMockedOutput } from 'testverse/setup';

import type { Merge } from 'type-fest';
import type { Arguments, PreExecutionContext } from 'types/global';

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
  return (preExecutionContext || (await getProgram())).execute(
    Array.isArray(argv) ? argv : argv.split(' ')
  ) as Promise<Arguments<CmdArgs>>;
}

/**
 * Wraps {@link withMockedExit} + {@link withMockedOutput} with {@link withMockedArgv}.
 */
export async function withMocks(
  fn: (
    spies: Merge<
      Parameters<Parameters<typeof withMockedOutput>[0]>[0],
      Parameters<Parameters<typeof withMockedExit>[0]>[0]
    >
  ) => Promise<void>,
  argv: string[] = [],
  options?: Parameters<typeof withMockedArgv>[2]
) {
  return withMockedArgv(
    () => {
      return withMockedExit((exitSpies) =>
        withMockedOutput((outputSpies) => fn(Object.assign({}, exitSpies, outputSpies)))
      );
    },
    argv,
    options
  );
}

export function getFixturePath(fixture: string) {
  return path.join(__dirname, 'fixtures', fixture);
}

export function expectedCommandsRegex(expectedCommands: string[]) {
  return new RegExp(
    'Commands:\\n\\s+xunnctl\\s+Description.*?\\s+\\[default]\\n' +
      expectedCommands
        .map((cmd) => '\\s+xunnctl\\s+' + cmd + '\\s+Description.*?\\n')
        .join('') +
      '\\n'
  );
}
