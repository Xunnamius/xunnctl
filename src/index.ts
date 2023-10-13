import { name as pkgName } from 'package';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { type Arguments, type Argv as Program } from 'yargs';

import {
  createListrManager,
  createListrTaskLogger,
  createGenericLogger,
  createDebugLogger,
  type ExtendedLogger,
  type ExtendedDebugger,
  type ListrManager
} from 'multiverse/rejoinder';

export type { Arguments, Program };

/**
 * The hard-coded maximum reporting depth of the causal stack when errors occur.
 */
export const MAX_LOG_ERROR_ENTRIES = 10;

/**
 * Well-known {@link ExtendedLogger} tags for filtering output automatically
 * depending on program state.
 */
export enum LogTag {
  IF_NOT_SILENCED = 'lens-cli:if-not-silenced',
  IF_NOT_QUIETED = 'lens-cli:if-not-quieted',
  IF_NOT_HUSHED = 'lens-cli:if-not-hushed'
}

/**
 * Accepts an optional array that defaults to `process.argv` and returns an
 * arguments object representing the parsed CLI input.
 */
export type Parser = (argv?: string[]) => Promise<Arguments>;

/**
 * The pre-execution context that is the result of calling
 * {@link configureProgram}.
 */
export type PreExecutionContext = ExecutionContext & {
  /**
   * An unexecuted yargs {@link Program}.
   */
  program: Program;
  /**
   * Execute `program`, parsing any available CLI arguments, and return the
   * parsed arguments.
   */
  parse: Parser;
};

/**
 * The context available to yargs, Listr tasks, Inquirer, etc execute.
 * `ExecutionContext` is passed around _by value_, not by reference!
 */
export type ExecutionContext = {
  /**
   * The {@link ExtendedLogger} for the current context.
   */
  log: ExtendedLogger;
  /**
   * The {@link ExtendedDebugger} for the current context.
   */
  debug: ExtendedDebugger;
  /**
   * The global Listr task manager singleton.
   */
  taskManager: ListrManager;
  /**
   * The state of the execution environment at the point the accessing function
   * or method was first invoked. Changes to one `state` object will not affect
   * any others; each `state` object is its own instance/copy.
   */
  state: {
    /**
     * If `true`, the program should not output anything at all. It also implies
     * `isQuieted` and `isHushed` are both `true`.
     */
    isSilenced: boolean;
    /**
     * If `true`, the program should be dramatically less verbose. It also
     * implies `isHushed` is `true`.
     */
    isQuieted: boolean;
    /**
     * If `true`, the program should stick to the most important output only.
     */
    isHushed: boolean;
  };
};

const rootDebugLogger = createDebugLogger({ namespace: pkgName });
const rootGenericLogger = createGenericLogger({ namespace: pkgName });
const debug = rootDebugLogger.extend('index');

/**
 * Create and return a pre-configured Yargs instance (program) and argv parser.
 */
export function configureProgram(): PreExecutionContext;
/**
 * Configure an existing Yargs instance (program) and return an argv parser.
 *
 * @param program A Yargs instance to configure
 */
export function configureProgram(program: Program): PreExecutionContext;
export function configureProgram(program?: Program): PreExecutionContext {
  const taskManager = createListrManager();
  const finalProgram = program || yargs();

  const context: ExecutionContext = {
    log: rootGenericLogger,
    debug: rootDebugLogger,
    taskManager,
    state: {
      isSilenced: false,
      isQuieted: false,
      isHushed: false
    }
  };

  void createListrTaskLogger;

  finalProgram
    .scriptName('xunnctl')
    .usage('$0 [path1, path2, ...] X Y Z' + '\n\nTODO')
    .options({
      silent: {
        alias: 's',
        describe: 'Nothing will be printed to stdout or stderr',
        type: 'boolean'
      },
      force: {
        describe: 'Always stage paths even when doing so could damage the index',
        type: 'boolean'
      }
    })
    .string('_')
    .group(
      ['scope-omit', 'scope-basename', 'scope-as-is', 'scope-full', 'scope-root'],
      'Scope options:'
    )
    .group(['help', 'version', 'silent', 'force', 'verify'], 'Other options:')
    .epilogue('See the full documentation for more details: https://xunn.at/xctl-docs')
    .example([['$0 Y Z', 'X']])
    .strictOptions();

  return {
    program: finalProgram,
    parse: async (argv_) => {
      const argv = argv_?.length ? argv_ : hideBin(process.argv);

      debug('argv: %O', argv);
      const finalArgv = await finalProgram.parse(argv);

      debug('finalArgv: %O', finalArgv);
      return finalArgv;
    },
    ...context
  };
}
