import fs from 'node:fs/promises';
import path from 'node:path';

import { name as pkgName, version as pkgVersion } from 'package';

import {
  AssertionFailedError,
  CommandNotImplementedError,
  DEFAULT_USAGE_TEXT,
  ErrorMessage,
  GracefulEarlyExitError,
  makeProgram,
  type Arguments,
  type Configuration,
  type ExecutionContext,
  type ImportedConfigurationModule,
  type Program,
  type ProgramMetadata
} from 'multiverse/black-flag';

import { wrapExecutionContext } from 'multiverse/black-flag/src/index';

const hasSpacesRegExp = /\s+/;

/**
 * Recursively scans the filesystem for _JavaScript_ index files starting at
 * `basePath`. Upon encountering such a file, it is imported along with each
 * sibling _JavaScript_ file in the same directory, treating the raw results as
 * {@link ImportedConfigurationModule} objects. These are translated into
 * {@link Configuration} objects, which are then used to create and configure
 * corresponding {@link Program} instances. Finally, these generated
 * {@link Program} instances are wired together hierarchically as a well-ordered
 * tree of commands. This allows end users to invoke child programs through
 * their respective parent programs, starting with the root program.
 *
 * For example, suppose we had a root program called `root` with two child
 * commands in the same directory: `create` and `retrieve`. Further suppose the
 * `create` program had its own child commands: `zone` and `account`. Then each
 * command could be invoked from the CLI like so:
 *
 * @example
 * ```text
 * root
 * root create
 * root create zone
 * root create account
 * root retrieve
 * ```
 *
 * Note how the `create` program is both a child program/command _and_ a parent
 * program simultaneously. This is referred to internally (e.g. debugging
 * output) as a "parent-child".
 *
 * Supported extensions in precedence order: `.js`, `.mjs`, `.cjs`.
 *
 * @returns An object with a `result` property containing the result of the very
 * first program that finishes executing. Due to the tree-like nature of
 * execution, `result` will not be available when the promise returned by
 * `discoverCommands` is resolved.
 */
export async function discoverCommands(
  basePath: string,
  rootProgram: Program<Record<string, unknown>>,
  context: ExecutionContext
): Promise<{
  /**
   * Stores the result of the latest call to `Program::parseAsync`, hence the
   * need for passing around a reference to the object containing this result.
   *
   * This is necessary because, with our depth-first multi-yargs architecture,
   * the parse job done by shallower yargs instances in the chain must not
   * mutate the result of the deepest call to `Program::parse*` in the execution
   * chain.
   */
  result: Arguments | undefined;
}> {
  // ! Invariant: first program to be discovered, if any, is the root program.
  let alreadyLoadedRootProgram = false;

  const debug = context.debug.extend('discover');
  const debug_load = debug.extend('load');

  const deepestParseResult: Awaited<ReturnType<typeof discoverCommands>> = {
    result: undefined
  };

  debug('beginning configuration module auto-discovery at %O', basePath);

  await discover(basePath);

  debug('configuration module auto-discovery completed');

  if (context.commands.size) {
    debug_load.message(
      '%O commands loaded: %O',
      context.commands.size,
      context.commands.keys()
    );
    debug_load.message('%O', context.commands);
  } else {
    debug_load.warn('auto-discovery failed to find any loadable configuration!');
  }

  return deepestParseResult;

  async function discover(
    configPath: string,
    lineage: string[] = [],
    previousParentProgram: Program<Record<string, unknown>> | undefined = undefined
  ): Promise<void> {
    const isRootProgram = !alreadyLoadedRootProgram;
    const parentType = isRootProgram ? 'root' : 'parent-child';

    const depth = lineage.length;

    debug('initial parent lineage: %O', lineage);
    debug('is root program: %O', isRootProgram);

    const parentProgram = isRootProgram ? rootProgram : makeProgram();
    const { configuration: parentConfig, metadata: parentMeta } = await loadConfiguration(
      ['js', 'mjs', 'cjs'].map((extension) =>
        path.join(configPath, `index.${extension}`)
      ),
      context
    );

    if (!parentConfig) {
      debug.warn(
        `skipped ${parentType} configuration (depth: %O) due to missing index file in directory %O`,
        depth,
        configPath
      );

      return;
    }

    lineage = [...lineage, parentConfig.name];
    const parentConfigFullName = lineage.join(' ');

    debug('updated parent lineage: %O', lineage);
    debug('program full name: %O', parentConfigFullName);

    if (isRootProgram) {
      configureRootProgram(parentProgram, parentConfig, parentConfigFullName);
    } else {
      configureParentProgram(
        parentProgram,
        parentConfig,
        parentConfigFullName,
        previousParentProgram
      );
    }

    debug_load(
      `discovered ${parentType} configuration (depth: %O) for program %O`,
      depth,
      parentConfigFullName
    );

    context.commands.set(parentConfigFullName, {
      // ? Cast as superclass
      program: parentProgram as Program<Record<string, unknown>>,
      metadata: parentMeta
    });

    debug(`added ${parentType} program to ExecutionContext::commands`);

    const configDir = await fs.opendir(configPath);
    const originalCommandCardinality = context.commands.size;

    for await (const entry of configDir) {
      const isPotentialChildConfigOfCurrentParent = /.*(?<!index)\.(?:js|cjs|mjs)$/.test(
        entry.name
      );

      debug('saw potential child configuration file: %O', entry.path);

      if (entry.isDirectory()) {
        debug('file is actually a directory, recursing...');
        await discover(entry.path, lineage, parentProgram);
      } else if (isPotentialChildConfigOfCurrentParent) {
        debug('attempting to load file...');
        const { configuration: childConfig, metadata: childMeta } =
          await loadConfiguration(entry.path, context);

        if (!childConfig) {
          debug.error(
            `failed to load child configuration (depth: %O) due to missing or invalid file %O`,
            depth,
            entry.path
          );

          throw new AssertionFailedError(ErrorMessage.ConfigLoadFailure(entry.path));
        }

        const childProgram = makeProgram();
        const childConfigFullName = `${parentConfigFullName} ${childConfig.name}`;

        debug('child full name (lineage): %O', childConfigFullName);

        configureChildProgram(
          childProgram,
          childConfig,
          childConfigFullName,
          parentProgram
        );

        debug_load(
          `discovered child configuration (depth: %O) for command %O`,
          depth + 1,
          childConfigFullName
        );

        context.commands.set(childConfigFullName, {
          // ? Cast as superclass
          program: childProgram as Program<Record<string, unknown>>,
          metadata: childMeta
        });

        debug('added child program to ExecutionContext::commands');
      } else {
        debug(
          'file was ignored (only non-index sibling JS files are considered at this stage)'
        );
      }
    }

    if (context.commands.size === originalCommandCardinality) {
      // ? If there were no child commands added in the last pass, making this
      // ? parent program a leaf node on the tree (i.e. child-like), then
      // ? tighten restrictions on this parent program.
      parentProgram.strict(true);
      debug('enabled strictness constraint on childless parent program');
    }
  }

  /**
   * Accepts one or more file paths and returns the parsed configuration and
   * associated metadata of the first file that is both readable and exports a
   * {@link Configuration} object.
   */
  async function loadConfiguration(
    configPath: string | string[],
    context: ExecutionContext
  ) {
    const isRootProgram = !alreadyLoadedRootProgram;

    const debug_ = debug.extend('load-configuration');
    const maybeConfigPaths = [configPath]
      .flat()
      .map((p) => p.trim())
      .filter(Boolean);

    debug_(
      'loading new configuration from the first readable path: %O',
      maybeConfigPaths
    );

    while (maybeConfigPaths.length) {
      try {
        const maybeConfigPath = maybeConfigPaths.shift()!;
        const meta = {} as ProgramMetadata;

        meta.filename = path.basename(maybeConfigPath);
        meta.filenameWithoutExtension = meta.filename.split('.').slice(0, -1).join('.');
        meta.filepath = maybeConfigPath;
        meta.parentDirName = path.basename(path.dirname(maybeConfigPath));

        const isParentProgram = meta.filenameWithoutExtension === 'index';

        meta.type = isRootProgram ? 'root' : isParentProgram ? 'parent-child' : 'child';

        debug_('attempting to load configuration file %O', meta.filename);

        debug_('configuration file absolute path: %O', maybeConfigPath);
        debug_('configuration file metadata: %O', meta);

        let maybeImportedConfig: ImportedConfigurationModule | undefined =
          // eslint-disable-next-line no-await-in-loop
          await import(maybeConfigPath).catch((error) => {
            debug_.warn(
              'a recoverable failure occurred while attempting to load configuration: %O',
              `${error}`
            );
          });

        if (maybeImportedConfig) {
          let rawConfig: Partial<Configuration>;

          if (!maybeImportedConfig.__esModule) {
            maybeImportedConfig = maybeImportedConfig.default;
          }

          if (typeof maybeImportedConfig === 'function') {
            debug_('configuration returned a function');
            // eslint-disable-next-line no-await-in-loop
            rawConfig = await maybeImportedConfig(context);
          } else {
            debug_('configuration returned an object');
            rawConfig = maybeImportedConfig || {};
          }

          // ? Ensure configuration namespace is copied by value!
          rawConfig = Object.assign({}, rawConfig);

          const finalConfig: Configuration = {
            aliases: rawConfig.aliases?.map((str) => str.trim()) || [],
            builder: rawConfig.builder || {},
            command: (rawConfig.command ?? '$0').trim() as '$0',
            deprecated: rawConfig.deprecated ?? false,
            // ? This property is trimmed below
            description: rawConfig.description ?? '',
            handler(...args) {
              debug_('entered actual handler function of %O', finalConfig.name);
              return (rawConfig.handler || defaultHandler)(...args);
            },
            name: (rawConfig.name || isRootProgram
              ? pkgName
              : isParentProgram
              ? meta.parentDirName
              : meta.filenameWithoutExtension
            ).trim(),
            // ? This property is trimmed below
            usage: rawConfig.usage || DEFAULT_USAGE_TEXT
          };

          finalConfig.usage = capitalize(finalConfig.usage).trim();

          finalConfig.description =
            typeof finalConfig.description === 'string'
              ? capitalize(finalConfig.description).trim()
              : finalConfig.description;

          debug_.message('successfully loaded configuration object: %O', finalConfig);
          debug_('validating loaded configuration object for correctness...');

          for (const name of [finalConfig.name, ...finalConfig.aliases]) {
            if (hasSpacesRegExp.test(name)) {
              throw new AssertionFailedError(
                ErrorMessage.InvalidCharacters(name, 'space(s)')
              );
            }

            if (name.includes('$0')) {
              throw new AssertionFailedError(ErrorMessage.InvalidCharacters(name, '$0'));
            }

            if (
              name.includes('<') ||
              name.includes('>') ||
              name.includes('[') ||
              name.includes(']')
            ) {
              throw new AssertionFailedError(
                ErrorMessage.InvalidCharacters(name, '<, >, [, or ]')
              );
            }
          }

          if (
            finalConfig.command !== '$0' &&
            (!finalConfig.command.startsWith('$0') ||
              !finalConfig.command.startsWith('$0 '))
          ) {
            throw new AssertionFailedError(
              ErrorMessage.AssertionFailureNamingInvariant(finalConfig.name)
            );
          }

          debug_('configuration is valid!');

          alreadyLoadedRootProgram = true;

          return { configuration: finalConfig, metadata: meta };
        }
      } catch (error) {
        debug_.error(
          'an irrecoverable failure occurred while loading configuration: %O',
          `${error}`
        );

        throw error;
      }
    }

    return { configuration: undefined, metadata: undefined };
  }

  /**
   * Configures the root (or _pure_ parent) program. Currently, this function:
   *
   * - Calls {@link configureParentProgram}
   * - Enables built-in `--version` support unless `package.json::version` is not
   *   available
   */
  function configureRootProgram(
    program: Program<Record<string, unknown>>,
    config: Configuration<Record<string, unknown>>,
    fullName: string
  ): void {
    configureParentProgram(program, config, fullName);

    // ? Only the root program should recognize the --version flag

    program.version(pkgVersion || false);

    debug('%O was additionally configured as: %O', config.name, 'root (pure parent)');
  }

  /**
   * Configures a parent (or parent-child) program. Currently, this function:
   *
   * - Disables built-in `--help` magic and replaces it with a custom solution
   * - Disables built-in `--version` support
   * - Configures usage help text template
   * - Configures script name
   * - Registers a default command and its aliases to `program`
   * - Disables strict mode as it's incompatible with programs with children
   * - Disables built-in exit-on-error behavior (we handle errors ourselves)
   * - Allow output to span entire terminal width
   * - Disable built-in error/help reporting (we'll handle it ourselves)
   *
   * And for parent-child programs (i.e. non-root parents) specifically:
   *
   * - Registers a proxy command (including aliases) to `parentProgram`
   */
  function configureParentProgram(
    program: Program<Record<string, unknown>>,
    config: Configuration<Record<string, unknown>>,
    fullName: string,
    parentParentProgram?: Program<Record<string, unknown>>
  ): void {
    // ? Swap out --help support for something that plays nice with the
    // ? existence of child programs
    program.help(false).option('help', { boolean: true });

    const handler = config.handler;
    config.handler = async (parsed) => {
      if (parsed.help) {
        // ? stdout for purposely showing help; stderr (the default) otherwise
        program.showHelp('log');
        throw new GracefulEarlyExitError();
      } else {
        return handler?.(parsed);
      }
    };

    // ? Only the root program should recognize the --version flag

    program.version(false);

    // ? Configure usage help text

    program.usage(config.usage ?? DEFAULT_USAGE_TEXT);

    // ? Configure the script's name

    program.scriptName(fullName);

    // ? Register a default command

    program.command(
      [config.command, ...config.aliases],
      config.description,
      config.builder,
      config.handler,
      [],
      config.deprecated
    );

    // ? Disable strict mode

    program.strict(false);

    // ? Disable exit-on-error functionality

    program.exitProcess(false);

    // ? Allow output text to span the entire screen

    program.wrap(context.state.initialTerminalWidth);

    // ? For parent-child programs, the same command with the parent, but use a
    // ? proxy handler

    parentParentProgram?.command_deferred(
      [config.command.replace('$0', config.name), ...config.aliases],
      config.description,
      config.builder,
      proxyHandler(program, config, fullName),
      [],
      config.deprecated
    );

    // ? We'll report on any errors manually

    program.showHelpOnFail(false);

    // ? Make yargs stop being so noisy when exceptional stuff happens

    program.fail((message, error) => {
      debug('entered custom yargs failure handler');
      throw error || message;
    });

    debug(
      '%O was additionally configured as: %O',
      config.name,
      !!parentParentProgram ? 'parent-child' : 'pure parent (root)'
    );
  }

  /**
   * Configures a _pure_ child program. Currently, this function:
   *
   * - Enables built-in `--help` magic
   * - Disables built-in `--version` support
   * - Configures usage help text template
   * - Configures script name
   * - Registers a default command and its aliases to `program`
   * - Registers a proxy command (including aliases) to `parentProgram`
   * - Disables strict mode since pure child commands don't have children
   * - Disables built-in exit-on-error behavior (we handle errors ourselves)
   * - Allow output to span entire terminal width
   * - Disable built-in error/help reporting (we'll handle it ourselves)
   */
  function configureChildProgram(
    program: Program<Record<string, unknown>>,
    config: Configuration<Record<string, unknown>>,
    fullName: string,
    parentProgram: Program<Record<string, unknown>>
  ): void {
    // ? Only child programs should use the built-in --help magic

    program.help(true);

    // ? Only the root program should recognize the --version flag

    program.version(false);

    // ? Configure usage help text

    program.usage(config.usage ?? DEFAULT_USAGE_TEXT);

    // ? Configure the script's name

    program.scriptName(fullName);

    // ? Register a default command

    program.command(
      [config.command, ...config.aliases],
      config.description,
      config.builder,
      config.handler,
      [],
      config.deprecated
    );

    // ? Register the same command with the parent, but use a proxy handler

    parentProgram.command_deferred(
      [config.command.replace('$0', config.name), ...config.aliases],
      config.description,
      config.builder,
      proxyHandler(program, config, fullName),
      [],
      config.deprecated
    );

    // ? Enable strict mode

    program.strict(true);

    // ? Disable exit-on-error functionality

    program.exitProcess(false);

    // ? Allow output text to span the entire screen

    program.wrap(context.state.initialTerminalWidth);

    // ? We'll report on any errors manually

    program.showHelpOnFail(false);

    // ? Make yargs stop being so noisy when exceptional stuff happens

    program.fail((message, error) => {
      debug('entered custom yargs failure handler');
      throw error || message;
    });

    debug('%O was additionally configured as: %O', config.name, 'pure child');
  }

  /**
   * A proxy handler used to bridge nested commands between parent and child
   * yargs instances, similar in intent to a reverse-proxy in networking.
   */
  function proxyHandler(
    childProgram: Program<Record<string, unknown>>,
    childConfig: Configuration<Record<string, unknown>>,
    fullName: string
  ) {
    // TODO: create variable here that facilitates double parsing (may need to
    // TODO: factor this out into its own function, since root needs it too)
    return async function (_parsed: Arguments) {
      const debug_ = debug.extend('proxy');
      const givenName = context.state.rawArgv.shift();
      const acceptableNames = [childConfig.name, ...childConfig.aliases];

      if (debug_.enabled) {
        const splitName = fullName.split(' ');
        debug_.message(
          'entered proxy handler function bridging %O ==> %O',
          splitName.slice(0, -1).join(' '),
          splitName.at(-1)
        );
      }

      debug_('ordering invariant: %O must be one of: %O', givenName, acceptableNames);

      const rawArgvSatisfiesArgumentOrderingInvariant =
        givenName && acceptableNames.includes(givenName);

      if (!rawArgvSatisfiesArgumentOrderingInvariant) {
        debug_.error('ordering invariant violated!');

        throw new AssertionFailedError(ErrorMessage.AssertionFailureOrderingInvariant());
      }

      debug_('invariant satisfied');
      debug_('calling ::parseAsync on child program');

      const localArgv = await childProgram.parseAsync(
        context.state.rawArgv,
        wrapExecutionContext(context)
      );

      const isDeepestParseResult = !deepestParseResult.result;
      deepestParseResult.result ??= localArgv;

      debug_('is deepest parse result: %O', isDeepestParseResult);
      debug_(
        `::parseAsync result${!isDeepestParseResult ? ' (discarded)' : ''}: %O`,
        localArgv
      );
    };
  }

  /**
   * The default handler used when a {@link Configuration} is missing a `handler`
   * export.
   */
  function defaultHandler() {
    throw new CommandNotImplementedError();
  }

  /**
   * Uppercase the first letter of a string.
   */
  function capitalize(str: string) {
    return (str.at(0)?.toUpperCase() || '') + str.slice(1);
  }
}
