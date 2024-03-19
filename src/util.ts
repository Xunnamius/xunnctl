import { mkdir } from 'node:fs/promises';

import { $executionContext, CliError, type Configuration } from '@black-flag/core';

import {
  ExtendedLogger,
  createListrManager,
  disableLoggingByTag
} from 'multiverse/rejoinder';

import { CustomExecutionContext } from 'universe/configure';
import { LogTag } from 'universe/constant';
import { ErrorMessage } from 'universe/error';

/**
 * These properties will be available in the `argv` object of any command that
 * uses `withGlobalOptions` to construct its `builder`.
 */
export type GlobalCliArguments = {
  'config-path': string;
  hush: boolean;
  quiet: boolean;
  silent: boolean;
};

/**
 * Generate standard command usage text.
 */
export function makeUsageString(altDescription = '$1.') {
  if (altDescription?.endsWith('.') === false) {
    altDescription += '.';
  }

  return `Usage: $000\n\n${altDescription}`.trim();
}

/**
 * Returns a well-known configuration path.
 */
export async function getWellKnownConfigPath() {
  const { config: configDirPath } = (await import('env-paths')).default('xunnctl');
  await mkdir(configDirPath, { recursive: true, mode: 0o770 });
  return `${configDirPath}/state.json`;
}

/**
 * Prints a timestamp indicating the beginning of execution.
 */
export function logStartTime({
  log,
  startTime
}: {
  log: ExtendedLogger;
  startTime: Date;
}) {
  log(
    [LogTag.IF_NOT_HUSHED],
    'Execution began on',
    startTime.toLocaleDateString(),
    'at',
    startTime.toLocaleTimeString()
  );
}

/**
 * Returns a builder function that wraps `customBuilder` to provide standard CLI
 * options (i.e. config-path, silent, etc). Most if not all commands should wrap
 * their builder objects/functions with this function.
 */
export async function withGlobalOptions<CustomCliArguments extends GlobalCliArguments>(
  customBuilder?: Configuration<CustomCliArguments, CustomExecutionContext>['builder']
): Promise<Configuration<CustomCliArguments, CustomExecutionContext>['builder']> {
  const defaultConfigPath = await getWellKnownConfigPath();
  return function builder(blackFlag, helpOrVersionSet, argv) {
    blackFlag.options({
      'config-path': {
        string: true,
        default: defaultConfigPath,
        description: 'Use a custom configuration file'
      },
      hush: {
        boolean: true,
        default: false,
        description: 'Set output to be somewhat less verbose'
      },
      quiet: {
        boolean: true,
        default: false,
        description: 'Set output to be dramatically less verbose (implies --hush)'
      },
      silent: {
        boolean: true,
        default: false,
        description: 'No output will be generated (implies --quiet)'
      }
    });

    return typeof customBuilder === 'function'
      ? customBuilder(blackFlag, helpOrVersionSet, argv)
      : customBuilder;
  };
}

/**
 * Returns a handler function that wraps `customHandler` to provide the
 * functionality for the standard CLI options (i.e. config-path, silent, etc).
 * Most if not all commands should wrap their handler functions with this
 * function.
 */
export async function withGlobalOptionsHandling<
  CustomCliArguments extends GlobalCliArguments
>(
  customHandler: Configuration<CustomCliArguments, CustomExecutionContext>['handler']
): Promise<Configuration<CustomCliArguments, CustomExecutionContext>['handler']> {
  return async function handler(argv) {
    const {
      hush,
      quiet,
      silent,
      configPath,
      [$executionContext]: executionContext
    } = argv;

    const tags = new Set<LogTag>();
    const debug = executionContext.debug_.extend('globalOptionsHandling');

    debug('entered global options wrapper (handler)');
    debug('hush: %O', hush);
    debug('quiet: %O', quiet);
    debug('silent: %O', silent);
    debug('configPath: %O', configPath);

    if (silent) {
      tags.add(LogTag.IF_NOT_SILENCED);
      executionContext.state.isSilenced = true;
      tags.add(LogTag.IF_NOT_QUIETED);
      executionContext.state.isQuieted = true;
      tags.add(LogTag.IF_NOT_HUSHED);
      executionContext.state.isHushed = true;

      // ? Redefine taskManager with a silent renderer
      executionContext.taskManager = createListrManager({
        overrides: {
          silentRendererCondition: () =>
            executionContext.taskManager.options?.renderer === 'default'
        }
      });
    }

    if (quiet) {
      tags.add(LogTag.IF_NOT_QUIETED);
      executionContext.state.isQuieted = true;
      tags.add(LogTag.IF_NOT_HUSHED);
      executionContext.state.isHushed = true;
    }

    if (hush) {
      tags.add(LogTag.IF_NOT_HUSHED);
      executionContext.state.isHushed = true;
    }

    disableLoggingByTag({ tags: Array.from(tags) });

    await customHandler(argv);
  };
}

/**
 * Accepts an object of option-value pairs and throws if all values are
 * `undefined`.
 *
 * If called in the same function as `logStartTime`, `ensureAtLeastOneOptionWasGiven` should be called first.
 */
export function ensureAtLeastOneOptionWasGiven(givenOptions: Record<string, unknown>) {
  const sawAtLeastOne = Object.entries(givenOptions).some(
    ([, value]) => value !== undefined
  );

  if (!sawAtLeastOne) {
    throw new CliError(ErrorMessage.MissingOneOfSeveralOptions(givenOptions), {
      showHelp: true
    });
  }
}
