import {
  FrameworkExitCode,
  type Arguments,
  type ConfigureHooks,
  type ExecutionContext,
  type PreExecutionContext
} from 'multiverse/black-flag';

import { isCliError, isGracefulEarlyExitError } from 'multiverse/black-flag/util';

import type { EmptyObject, Promisable } from 'type-fest';

type RunProgramSignature1 = [commandModulePath?: string];
type RunProgramSignature2<CustomContext extends ExecutionContext> = [
  commandModulePath: string | undefined,
  configurationHooks: Promisable<ConfigureHooks<CustomContext>>
];
type RunProgramSignature3<CustomContext extends ExecutionContext> = [
  commandModulePath: string | undefined,
  preExecutionContext: PreExecutionContext<CustomContext>
];
type RunProgramSignature4 = [
  commandModulePath: string | undefined,
  argv: string | string[]
];

type RunProgramSignature5<CustomContext extends ExecutionContext> = [
  commandModulePath: string | undefined,
  argv: string | string[],
  configurationHooks: Promisable<ConfigureHooks<CustomContext>>
];

type RunProgramSignature6<CustomContext extends ExecutionContext> = [
  commandModulePath: string | undefined,
  argv: string | string[],
  preExecutionContext: PreExecutionContext<CustomContext>
];

type RunProgramSignature<CustomContext extends ExecutionContext> =
  | RunProgramSignature1
  | RunProgramSignature2<CustomContext>
  | RunProgramSignature3<CustomContext>
  | RunProgramSignature4
  | RunProgramSignature5<CustomContext>
  | RunProgramSignature6<CustomContext>;

/**
 * A symbol that can sometimes be found as a key within the return value of
 * {@link runProgram}. If `true`, it signifies that the CLI would have exited
 * gracefully (with a zero exit code). The implication is not bi-directional:
 * the CLI may suggest a zero exit code as a result of invoking
 * {@link runProgram} but without `$exitedGracefully` being set to `true`; e.g.
 * when a program's handler function calls `process.exit(1)` directly.
 *
 * Therefore, do not rely on the presence or absence of `$exitedGracefully` for
 * anything but strict internal use.
 *
 * @internal
 */
export const $exitedGracefully = Symbol.for('black-flag:was-graceful-exit');

/**
 * A factory function that returns a {@link runProgram} function that can be
 * called multiple times while only having to provide the `commandModulePath`
 * parameter, as well as the optional `CustomContext` and `CustomCliArguments`
 * type parameters, once.
 *
 * This is useful when unit/integration testing your CLI, which will likely
 * require multiple calls to `runProgram(...)`.
 */
export async function makeRunner<
  CustomCliArguments extends Record<string, unknown> = EmptyObject
>(commandModulePath: string | undefined) {
  return <
    CustomContext extends ExecutionContext,
    T extends RunProgramSignature<CustomContext>
  >(
    ...args: T extends [infer _, ...infer Tail] ? Tail : never
  ) => {
    const tail = [commandModulePath, ...args] as unknown as Parameters<
      typeof runProgram<CustomContext, CustomCliArguments>
    >;

    return runProgram<CustomContext, CustomCliArguments>(...tail);
  };
}

/**
 * Invokes the dynamically imported `configureProgram().execute()` function.
 *
 * This function is suitable for a CLI entry point since it will **never throw
 * no matter what.** Instead, when an error is caught, `process.exitCode` is set
 * to the appropriate value and `undefined` is returned.
 */
export async function runProgram<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CustomContext extends ExecutionContext,
  CustomCliArguments extends Record<string, unknown> = EmptyObject
>(...args: RunProgramSignature1): Promise<Arguments<CustomCliArguments> | undefined>;
/**
 * Invokes the dynamically imported
 * `configureProgram(configurationHooks).execute()` function.
 *
 * This function is suitable for a CLI entry point since it will **never throw
 * no matter what.** Instead, when an error is caught, `process.exitCode` is set
 * to the appropriate value and `undefined` is returned.
 */
export async function runProgram<
  CustomContext extends ExecutionContext,
  CustomCliArguments extends Record<string, unknown> = EmptyObject
>(
  ...args: RunProgramSignature2<CustomContext>
): Promise<Arguments<CustomCliArguments> | undefined>;
/**
 * Invokes the `preExecutionContext.execute()` function.
 *
 * This function is suitable for a CLI entry point since it will **never throw
 * no matter what.** Instead, when an error is caught, `process.exitCode` is set
 * to the appropriate value and `undefined` is returned.
 */
export async function runProgram<
  CustomContext extends ExecutionContext,
  CustomCliArguments extends Record<string, unknown> = EmptyObject
>(
  ...args: RunProgramSignature3<CustomContext>
): Promise<Arguments<CustomCliArguments> | undefined>;
/**
 * Invokes the dynamically imported `configureProgram().execute(argv)` function.
 *
 * **This function will always re-throw any error it catches.**
 */
export async function runProgram<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CustomContext extends ExecutionContext,
  CustomCliArguments extends Record<string, unknown> = EmptyObject
>(...args: RunProgramSignature4): Promise<Arguments<CustomCliArguments>>;
/**
 * Invokes the dynamically imported
 * `configureProgram(configurationHooks).execute(argv)` function.
 *
 * **This function will always re-throw any error it catches.**
 */
export async function runProgram<
  CustomContext extends ExecutionContext,
  CustomCliArguments extends Record<string, unknown> = EmptyObject
>(...args: RunProgramSignature5<CustomContext>): Promise<Arguments<CustomCliArguments>>;
/**
 * Invokes the `preExecutionContext.execute(argv)` function.
 *
 * **This function will always re-throw any error it catches.**
 */
export async function runProgram<
  CustomContext extends ExecutionContext,
  CustomCliArguments extends Record<string, unknown> = EmptyObject
>(...args: RunProgramSignature6<CustomContext>): Promise<Arguments<CustomCliArguments>>;
export async function runProgram<
  CustomContext extends ExecutionContext,
  CustomCliArguments extends Record<string, unknown> = EmptyObject
>(
  ...args: RunProgramSignature<CustomContext>
): Promise<Arguments<CustomCliArguments> | undefined> {
  const commandModulePath = args[0];
  let argv: string | string[] | undefined = undefined;
  let configurationHooks: ConfigureHooks<CustomContext> | undefined = undefined;
  let preExecutionContext: PreExecutionContext<CustomContext> | undefined = undefined;

  if (typeof args[1] === 'string' || Array.isArray(args[1])) {
    // * Must be 4, 5, or 6
    argv = args[1];

    if (args[2]) {
      // * Must be 5 or 6
      if ('execute' in args[2] && 'program' in args[2]) {
        // * Must be 6
        preExecutionContext = args[2];
      } else {
        // * Must be 5
        configurationHooks = await args[2];
      }
    }
  } else if (args[1]) {
    // * Must be 2 or 3
    if ('execute' in args[1] && 'program' in args[1]) {
      // * Must be 3
      preExecutionContext = args[1];
    } else {
      // * Must be 2
      configurationHooks = await args[1];
    }
  }

  try {
    preExecutionContext ||= await (
      await import('multiverse/black-flag')
    ).configureProgram(commandModulePath, configurationHooks);

    const parsedArgv = (await preExecutionContext.execute(
      Array.isArray(argv) ? argv : typeof argv === 'string' ? argv.split(' ') : undefined
    )) as Arguments<CustomCliArguments>;

    process.exitCode = FrameworkExitCode.OK;

    return parsedArgv;
  } catch (error) {
    if (!argv) {
      process.exitCode = isCliError(error)
        ? error.suggestedExitCode
        : FrameworkExitCode.DEFAULT_ERROR;
    }

    if (isGracefulEarlyExitError(error)) {
      const parsedArgv = (preExecutionContext?.program.parsed || { argv: {} })
        .argv as Arguments<CustomCliArguments>;

      return Object.assign(parsedArgv, { [$exitedGracefully]: true });
    }

    if (argv) {
      throw error;
    } else {
      return undefined;
    }
  }
}
