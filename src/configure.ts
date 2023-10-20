import { hideBin } from 'yargs/helpers';

import type { Arguments, ExecutionContext, Program } from 'types/global';
import type { $executionContext } from 'universe/constant';

// * This is the place where, along with universe/error and universe/command,
// * customizations can easily be made. This makes creating new CLI apps really
// * fast, easy, and fun! :)

/**
 * The project-specific shape of the parsed CLI arguments, excluding `_`, `$0`,
 * and any framework arguments or catch-all indexers.
 *
 * This type is useful for "bare bones" implementations. Defining this type is
 * useless if you're using command auto-discovery, since each imported
 * `Configuration` should export and utilize its own command-specific
 * {@link Arguments} type and/or those exported by other commands.
 */
export type CliArguments = {
  //
};

// ** The following "lifecycle" functions are listed in order of execution ** \\

/**
 * This function is called once towards the beginning of the execution of
 * `configureProgram` and should return a parsed `process.env`-style object
 * where the value type is not limited to `string`.
 *
 * Other than `process.env.DEBUG`, all environment variables will be sourced
 * from the object returned by this function. `process.env` will not be
 * consulted directly.
 */
export function configureEnvironment(
  environment: typeof process.env,
  context: ExecutionContext
) /*: as const */ {
  void environment, context;

  // ! Always return result "as const" so that the key-value types are explicit.
  return {
    // TODO
  } as const;
}

/**
 * This function is called once towards the beginning of the execution of
 * `configureProgram` and should return a global "base" context object from
 * which to shallow copy.
 */
export function configureExecutionContext(context: ExecutionContext): ExecutionContext {
  return context;
}

/**
 * This function is called once towards the end of the execution of
 * `configureProgram`, after all commands have been discovered but before any
 * have been executed, and should apply any final configurations to the yargs
 * instances that constitute the command line interface.
 *
 * All commands and sub-commands known to yargs are available on the
 * {@link ExecutionContext} object, which can be accessed from the `context`
 * parameter or from the {@link Arguments} object returned by
 * {@link Program.parse} et al.
 *
 * This function is the complement of {@link configureExecutionEpilogue}.
 */
export function configureExecutionPrologue(
  program: Program<CliArguments>,
  context: ExecutionContext
): void {
  void program, context;
}

/**
 * This function is called once towards the beginning of the execution of
 * `configureProgram` and should return a `process.argv`-like array.
 */
export function configureArguments(
  rawArgv: typeof process.argv,
  context: ExecutionContext
): typeof process.argv {
  void context;
  return hideBin(rawArgv);
}

/**
 * This function is called once after CLI argument parsing completes and command
 * auto-discovery and handler execution succeeds. The value returned by this
 * function is used as the return value (and return type) of the `execute`
 * method on the object returned by `configureProgram`.
 *
 * This function can be used to implement a simple "bare bones" command line
 * interface, rather than rely on command auto-discovery.
 *
 * This function is the complement of {@link configureExecutionPrologue}.
 */
export async function configureExecutionEpilogue(
  argv: Arguments<CliArguments>,
  context: ExecutionContext
): Promise<Arguments<CliArguments>> {
  void context;
  return argv;
}

/**
 * This function is called once at the very end of the error handling process
 * after an error has occurred.
 *
 * Note that this function is _always_ called whenever there is an error,
 * regardless of which other functions have already been called. The only
 * exception to this is if the error occurs within
 * `configureErrorHandlingEpilogue` itself.
 */
export async function configureErrorHandlingEpilogue(
  error: unknown,
  argv: Omit<Partial<Arguments<CliArguments>>, typeof $executionContext> & {
    // ? Ensure $executionContext is required
    [$executionContext]: ExecutionContext;
  },
  context: ExecutionContext
): Promise<void> {
  void error, argv, context;
}
