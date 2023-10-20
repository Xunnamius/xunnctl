import fs from 'node:fs/promises';
import path from 'node:path';

import { name as pkgName, version as pkgVersion } from 'package';

import { makeProgram, wrapExecutionContext } from 'universe/index';

import {
  AssertionFailedError,
  ErrorMessage,
  GracefulEarlyExitError,
  NotImplementedError
} from 'universe/error';

import { DEFAULT_USAGE_TEXT } from 'universe/constant';

import type {
  Arguments,
  Configuration,
  ExecutionContext,
  ImportedConfigurationModule,
  Program,
  ProgramMetadata
} from 'types/global';

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
 * @returns An object with a `firstParseResult` property containing the result
 * of the very first program that finishes executing. Due to the tree-like
 * nature of the
 */
export async function discoverCommands<T extends Record<string, unknown>>(
  basePath: string,
  rootProgram: Program<T>,
  context: ExecutionContext
): Promise<{
  /**
   * Stores the result of the latest call to `Program::parse*`, hence the need
   * for passing around a reference to the object containing this result.
   *
   * This is necessary because, with our depth-first multi-yargs architecture,
   * the parse job done by shallower yargs instances in the chain must not
   * replace the result of the deepest call to `Program::parse*` in the chain of
   * distinct yargs instances' command handlers.
   */
  firstParseResult: Arguments<T> | undefined;
}> {
  // ! Invariant: first program to be discovered, if any, is the root program.
  let alreadyLoadedRootProgram = false;

  const debug = context.debug.extend('discover');
  const debug_load = debug.extend('load');
  const reference: Awaited<ReturnType<typeof discoverCommands<T>>> = {
    firstParseResult: undefined
  };

  debug('beginning configuration module auto-discovery at %O', basePath);

  await discover(basePath);

  debug('configuration module auto-discovery completed');

  if (context.commands.size) {
    debug_load.message('%O commands loaded: %O', context.commands.size, context.commands);
  } else {
    debug_load.warn('auto-discovery failed to find any loadable configuration!');
  }

  return reference;

  async function discover(configPath: string, lineage: string[] = []): Promise<void> {
    const isRootProgram = !alreadyLoadedRootProgram;
    const parentType = isRootProgram ? 'root' : 'parent-child';

    const depth = lineage.length;

    debug('current parent lineage: %O', lineage);
    debug('is root program: %O', isRootProgram);

    const parentProgram = isRootProgram ? rootProgram : makeProgram<T>();
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

    lineage.push(parentConfig.name);
    const parentConfigFullName = lineage.join(' ');

    debug('updated parent lineage: %O', lineage);
    debug('program full name: %O', parentConfigFullName);

    if (isRootProgram) {
      configureRootProgram(parentProgram, parentConfig, parentConfigFullName);
    } else {
      configureParentProgram(parentProgram, parentConfig, parentConfigFullName);
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
    let configDirIsEmpty = true;

    for await (const entry of configDir) {
      configDirIsEmpty = false;

      const isPotentialChildConfigOfCurrentParent = /.*(?<!index)\.(?:js|cjs|mjs)$/.test(
        entry.name
      );

      if (isPotentialChildConfigOfCurrentParent) {
        if (entry.isDirectory()) {
          await discover(entry.path, lineage);
        } else {
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

          const childProgram = makeProgram<T>();
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
        }
      }
    }

    if (configDirIsEmpty) {
      // ? If there were no child commands added from the above loop, loosen
      // ? restrictions on this poor childless parent program.
      parentProgram.strict(true);
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

        let maybeImportedConfig: ImportedConfigurationModule<T> | undefined =
          // eslint-disable-next-line no-await-in-loop
          await import(maybeConfigPath).catch((error) => {
            debug_.warn(
              'a recoverable failure occurred while attempting to load configuration: %O',
              `${error}`
            );
          });

        if (maybeImportedConfig) {
          let rawConfig: Partial<Configuration<T>>;

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

          const finalConfig: Configuration<T> = {
            aliases: rawConfig.aliases?.map((str) => str.trim()) || [],
            builder: rawConfig.builder || {},
            command: (rawConfig.command ?? '$0').trim() as '$0',
            deprecated: rawConfig.deprecated ?? false,
            // ? This property is trimmed below
            description: rawConfig.description ?? '',
            handler: rawConfig.handler || defaultHandler,
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
   * Configures the root program. Currently, this function:
   *
   * - Calls {@link configureParentProgram}
   * - Enables built-in `--version` support unless `package.json::version` is not
   *   available
   */
  function configureRootProgram(
    program: Program<T>,
    config: Configuration<T>,
    fullName: string
  ): void {
    configureParentProgram(program, config, fullName);

    // ? Only the root program should recognize the --version flag

    program.version(pkgVersion || false);

    // ? Allow output text to span the entire screen

    program.wrap(context.state.initialTerminalWidth);

    debug('%O was additionally configured as: %O', config.name, 'root');
  }

  /**
   * Configures a parent program. Currently, this function:
   *
   * - Disables built-in `--help` magic and replaces it with a custom solution
   * - Disables built-in `--version` support
   * - Configures usage help text template
   * - Configures script name
   * - Registers a default command and its aliases
   * - Disables strict mode as it's incompatible with programs with children
   * - Disables built-in exit-on-error behavior (we handle errors ourselves)
   */
  function configureParentProgram(
    program: Program<T>,
    config: Configuration<T>,
    fullName: string
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
      undefined,
      config.deprecated
    );

    // ? Disable strict mode

    program.strict(false);

    // ? Disable exit-on-error functionality

    program.exitProcess(false);

    // ? Allow output text to span the entire screen

    program.wrap(context.state.initialTerminalWidth);

    debug('%O was additionally configured as: %O', config.name, 'parent');
  }

  /**
   * Configures a child program. Currently, this function:
   *
   * - Disables built-in `--version` support
   * - Configures usage help text template
   * - Configures script name
   * - Registers a default command and its aliases
   * - Disables strict mode since pure child commands don't have children
   * - Disables built-in exit-on-error behavior (we handle errors ourselves)
   */
  function configureChildProgram(
    program: Program<T>,
    config: Configuration<T>,
    fullName: string,
    parentProgram: Program<T>
  ): void {
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
      undefined,
      config.deprecated
    );

    // ? Register the same command with the parent, but use a custom handler

    parentProgram.command(
      [config.command.replace('$0', config.name), ...config.aliases],
      config.description,
      config.builder,
      async (_parsed) => {
        const givenName = context.state.rawArgv.shift();
        const acceptableNames = [config.name, ...config.aliases];

        debug('entered handler function of %O', fullName);
        debug('ordering invariant: %O must be one of: %O', givenName, acceptableNames);

        const rawArgvSatisfiesArgumentOrderingInvariant =
          givenName && acceptableNames.includes(givenName);

        if (!rawArgvSatisfiesArgumentOrderingInvariant) {
          debug.error('ordering invariant violated!');

          throw new AssertionFailedError(
            ErrorMessage.AssertionFailureOrderingInvariant()
          );
        }

        debug('invariant satisfied');
        debug('is first parse result: %O', !reference.firstParseResult);
        debug('calling ::parseAsync on child program');

        reference.firstParseResult ??= await program.parseAsync(
          context.state.rawArgv,
          wrapExecutionContext(context)
        );

        debug('::parseAsync result: %O', reference.firstParseResult);
      },
      undefined,
      config.deprecated
    );

    // ? Enable strict mode

    program.strict(true);

    // ? Disable exit-on-error functionality

    program.exitProcess(false);

    debug('%O was additionally configured as: %O', config.name, 'child');
  }
}

/**
 * The default handler used when a {@link Configuration} is missing a `handler`
 * export.
 */
function defaultHandler() {
  throw new NotImplementedError();
}

/**
 * Uppercase the first letter of a string.
 */
function capitalize(str: string) {
  return (str.at(0)?.toUpperCase() || '') + str.slice(1);
}
