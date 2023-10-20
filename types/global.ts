import type { Promisable } from 'type-fest';

import type {
  ArgumentsCamelCase as _Arguments,
  Options as _Options,
  Argv as _Program
} from 'yargs';

import type {
  ExtendedDebugger,
  ExtendedLogger,
  ListrManager
} from 'multiverse/rejoinder';

import type { configureArguments, configureExecutionEpilogue } from 'universe/configure';
import type { $executionContext } from 'universe/constant';

/**
 * Represents the shape of the parsed CLI arguments, plus `_` and `$0`, any
 * upstream arguments, and an indexer falling back to `unknown` for unrecognized
 * arguments.
 */
export type Arguments<RawArgs extends Record<string, unknown>> = _Arguments<
  FrameworkArguments & RawArgs
>;

/**
 * Represents a pre-configured yargs instance ready for argument parsing and
 * execution.
 *
 * While similar to the `Argv` type exported by yargs, `Program` comes with
 * several fixes and should be preferred.
 */
export type Program<RawArgs extends Record<string, unknown>> = Omit<
  _Program<FrameworkArguments & RawArgs>,
  'command'
> & {
  // ? Adds custom overload signatures that fixes the lack of implementation
  // ? signature exposure in the Argv type exposed by yargs

  command: _Program<RawArgs>['command'] & {
    (
      command: string | string[],
      description: Configuration<RawArgs>['description'],
      builder: Configuration<RawArgs>['builder'],
      handler: Configuration<RawArgs>['handler'],
      // ? configureArguments already handles this use case, so...
      middlewares: undefined,
      deprecated: Configuration<RawArgs>['deprecated']
    ): Program<RawArgs>;
  };

  version: _Program<RawArgs>['version'] & {
    (version: string | false): Program<RawArgs>;
  };
};

/**
 * A replacement for the broken `CommandModule` type that comes with yargs.
 * Auto-discovered configuration modules must implement this interface or its
 * descendant.
 */
export type Configuration<RawArgs extends Record<string, unknown>> = {
  /**
   * An array of `command` aliases [as
   * interpreted](https://github.com/yargs/yargs/pull/647) by
   * [yargs](https://github.com/yargs/yargs/blob/main/docs/advanced.md#command-aliases).
   *
   * Note that positional arguments defined in aliases are ignored.
   *
   * @default []
   */
  aliases: string[];
  /**
   * An object containing yargs options configuration or a function that will
   * receive and return the current yargs instance.
   *
   * **If `builder` is a function, it cannot be async or return a promise** due
   * to a yargs bug present at time of writing that I haven't yet reported:
   * providing an async builder for the default command prevents `--help` from
   * printing text (and probably messes up other stuff more subtly) (a little
   * similar to [this
   * edit](https://github.com/yargs/yargs/issues/793#issuecomment-704749472)).
   * However, a {@link Configuration} module can export an async function, so
   * hoist any async logic to work around this bug for now.
   *
   * @default {}
   */
  builder:
    | { [key: string]: _Options }
    | ((yargs: Program<RawArgs>) => Program<RawArgs> | _Program);
  /**
   * The command as interpreted by yargs. May contain positional arguments.
   *
   * It is usually unnecessary to change or use this property.
   *
   * @default "$0"
   */
  command: '$0' | `$0 ${string}`;
  /**
   * If truthy, the command will be considered "deprecated" by yargs. If
   * `deprecated` is a string, it will additionally be treated as a deprecation
   * message and printed.
   *
   * @default false
   */
  deprecated: string | boolean;
  /**
   * The description for the command in help text. If `false`, the command will
   * be considered "hidden" by yargs.
   *
   * @default ""
   */
  description: string | false;
  /**
   * A function called when this command is invoked. It will receive an object
   * of parsed arguments.
   *
   * If undefined, a {@link CommandNotImplementedError} will be thrown.
   *
   * @default undefined
   */
  handler: (args: Arguments<RawArgs>) => Promisable<void>;
  /**
   * The name of the command. **Must not contain any spaces** or any characters
   * that yargs does not consider valid for a command name. An error will be
   * thrown if spaces are present.
   *
   * Defaults to the filename, excluding its extension, containing the
   * configuration, or the directory name if the filename without extension is
   * "index".
   */
  name: string;
  /**
   * Set a usage message shown at the top of the command's help text. The string
   * `$0` will be replaced with the _full name_ of the command.
   *
   * @default "Usage: $0"
   */
  usage: string;
};

/**
 * A partial extension to the {@link Configuration} interface for root
 * configurations. This type was designed for use in external ESM/CJS module
 * files that will eventually get imported via auto-discovery.
 */
export type RootConfiguration<RawArgs extends Record<string, unknown>> = Partial<
  ParentConfiguration<RawArgs>
>;

/**
 * A partial extension to the {@link Configuration} interface for non-root
 * parent configurations. This type was designed for use in external ESM/CJS
 * module files that will eventually get imported via auto-discovery.
 */
export type ParentConfiguration<RawArgs extends Record<string, unknown>> = Partial<
  Configuration<RawArgs>
>;

/**
 * A partial extension to the {@link Configuration} interface for child
 * configurations. This type was designed for use in external ESM/CJS module
 * files that will eventually get imported via auto-discovery.
 */
export type ChildConfiguration<RawArgs extends Record<string, unknown>> = Partial<
  Configuration<RawArgs>
>;

/**
 * The shape of a Configuration object imported from a CJS/ESM module external
 * to the CLI framework (e.g. importing an auto-discovered config module from a
 * file).
 */
export type ImportedConfigurationModule<RawArgs extends Record<string, unknown>> = (
  | ((
      context: ExecutionContext
    ) => Promisable<
      Partial<
        | RootConfiguration<RawArgs>
        | ParentConfiguration<RawArgs>
        | ChildConfiguration<RawArgs>
      >
    >)
  | Partial<
      | RootConfiguration<RawArgs>
      | ParentConfiguration<RawArgs>
      | ChildConfiguration<RawArgs>
    >
) &
  (
    | { __esModule?: false; default?: ImportedConfigurationModule<RawArgs> }
    | { __esModule: true }
  );

/**
 * Represents the CLI arguments added by the current framework rather than the
 * end user. Your project's custom `Arguments`-style type (e.g.
 * `ProgramArguments`) should extend from this one.
 */
export type FrameworkArguments = {
  [$executionContext]: ExecutionContext;
};

/**
 * Accepts an optional array that defaults to `process.argv` and returns an
 * arguments object representing the parsed CLI input for the given root
 * {@link Program}.
 */
export type Executor = (
  rawArgv?: Parameters<typeof configureArguments>[0]
) => Promise<Awaited<ReturnType<typeof configureExecutionEpilogue>>>;

/**
 * The pre-execution context that is the result of calling
 * {@link configureProgram}.
 */
export type PreExecutionContext = ExecutionContext & {
  /**
   * An unexecuted yargs {@link Program}.
   */
  program: Program<Record<string, unknown>>;
  /**
   * Execute `program`, parsing any available CLI arguments, and return the
   * parsed arguments.
   */
  execute: Executor;
};

/**
 * The shared context available to yargs, Listr tasks, Inquirer, etc execute.
 */
export type ExecutionContext = {
  /**
   * A Map consisting of auto-discovered {@link Program} instance values with
   * their respective _full names_ as keys.
   *
   * Note that key-value pairs will always be iterated in insertion order,
   * implying the first pair in the Map, if there are any pairs, will always be
   * the root program.
   */
  commands: Map<
    string,
    { program: Program<Record<string, unknown>>; metadata: ProgramMetadata }
  >;
  /**
   * The {@link ExtendedLogger} for the current runtime level.
   */
  log: ExtendedLogger;
  /**
   * The {@link ExtendedDebugger} for the current runtime level.
   */
  debug: ExtendedDebugger;
  /**
   * The global Listr task manager singleton.
   */
  taskManager: ListrManager;
  /**
   * The current state of the execution environment.
   */
  state: {
    /**
     * A subset of the original argv returned by {@link configureArguments}. It
     * is used internally to give the final command in the arguments list the
     * chance to parse argv. Further, it is used to enforce the ordering
     * invariant on chained child program invocations. That is: all
     * non-positional arguments must appear _after_ the last command name in any
     * arguments list parsed by this program.
     *
     * For example:
     *  - Good (satisfies invariant): `rootcmd subcmd subsubcmd --help`
     *  - Bad (violation of invariant): `rootcmd --help subcmd subsubcmd`
     *
     * Since it will be actively manipulated by each command in the arguments
     * list, **do not rely on `rawArgv` for anything other than checking
     * invariant satisfaction.**
     */
    rawArgv: typeof process.argv;
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
     * If `true`, the program should output only the most pertinent information.
     */
    isHushed: boolean;
    /**
     * The detected width of the terminal. This value is determined when
     * `configureProgram` is called.
     */
    initialTerminalWidth: number;
  };
};

/**
 * Meta information about a discovered {@link Program} instance and its
 * corresponding {@link Configuration} object/file.
 */
export type ProgramMetadata = {
  /**
   * The "type" of {@link Configuration} that was loaded, indicating which
   * interface to expect when interacting with `configuration`. The
   * possibilities are:
   *
   * - **root**: implements `RootConfiguration` (the only pure
   *   `ParentConfiguration`)
   * - **parent-child**: implements `ParentConfiguration`, `ChildConfiguration`
   * - **child**: implements `ChildConfiguration`
   *
   * Note that "root" `type` configurations are unique in that there will only
   * ever be one `RootConfiguration` instance, and it **MUST** be the first
   * command module auto-discovered and loaded (invariant).
   */
  type: 'root' | 'parent-child' | 'child';
  /**
   * Absolute filesystem path to the configuration file used to configure the
   * program.
   */
  filepath: string;
  /**
   * The basename of `filepath`.
   */
  filename: string;
  /**
   * The basename of `filepath` with the trailing extension trimmed.
   */
  filenameWithoutExtension: string;
  /**
   * The basename of the direct parent directory containing `filepath`.
   */
  parentDirName: string;
};
