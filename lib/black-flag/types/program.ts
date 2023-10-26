import type { EmptyObject } from 'type-fest';
import type { ArgumentsCamelCase as _Arguments, Argv as _Program } from 'yargs';

import type { ExtendedDebugger } from 'multiverse/rejoinder';

import type {
  $executionContext,
  Configuration,
  ConfigureArguments,
  ConfigureExecutionEpilogue
} from 'multiverse/black-flag';

/**
 * Represents the shape of the parsed CLI arguments, plus `_` and `$0`, any
 * (hidden) arguments/properties specific to Black Flag, and an indexer falling
 * back to `unknown` for unrecognized arguments.
 */
export type Arguments<CustomCliArguments extends Record<string, unknown> = EmptyObject> =
  _Arguments<FrameworkArguments & CustomCliArguments>;

/**
 * Represents a pre-configured yargs instance ready for argument parsing and
 * execution.
 *
 * `Program` is essentially a drop-in replacement for the `Argv` type exported
 * by yargs but with several differences and should be preferred.
 */
export type Program<CustomCliArguments extends Record<string, unknown> = EmptyObject> =
  Omit<_Program<FrameworkArguments & CustomCliArguments>, 'command'> & {
    // ? Adds custom overload signatures that fixes the lack of implementation
    // ? signature exposure in the Argv type exposed by yargs

    command: _Program<CustomCliArguments>['command'] & {
      (
        command: string | string[],
        description: Configuration<CustomCliArguments>['description'],
        builder: Configuration<CustomCliArguments>['builder'],
        handler: Configuration<CustomCliArguments>['handler'],
        // ? configureArguments already handles this use case, so...
        middlewares: [],
        deprecated: Configuration<CustomCliArguments>['deprecated']
      ): Program<CustomCliArguments>;
    };

    version: _Program<CustomCliArguments>['version'] & {
      (version: string | false): Program<CustomCliArguments>;
    };

    /**
     * @internal
     */
    command_deferred: Program<CustomCliArguments>['command'];

    /**
     * @internal
     */
    command_finalize_deferred: () => void;
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

/**
 * Represents the CLI arguments/properties added by Black Flag rather than the
 * end developer.
 *
 * Instead of using this type directly, your project's custom arguments (e.g.
 * `MyCustomArgs`) should be wrapped with the `Arguments` generic type (e.g.
 * `Arguments<MyCustomArgs>`), which will extend `FrameworkArguments` for you.
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
  rawArgv?: Parameters<ConfigureArguments>[0]
) => Promise<Awaited<ReturnType<ConfigureExecutionEpilogue>>>;

/**
 * The pre-execution context that is the result of calling `configureProgram`.
 */
export type PreExecutionContext<
  CustomContext extends ExecutionContext = ExecutionContext
> = CustomContext & {
  /**
   * The root yargs {@link Program}.
   */
  program: Program;
  /**
   * Execute `program`, parsing any available CLI arguments, and return the
   * parsed arguments.
   */
  execute: Executor;
};

/**
 * The globally-accessible shared context object.
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
   * The {@link ExtendedDebugger} for the current runtime level.
   */
  debug: ExtendedDebugger;
  /**
   * The current state of the execution environment.
   */
  state: {
    /**
     * A subset of the original argv returned by {@link ConfigureArguments}. It
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
     * The detected width of the terminal. This value is determined when
     * `configureProgram` is called.
     */
    initialTerminalWidth: number;

    [key: string]: unknown;
  };

  [key: string]: unknown;
};
