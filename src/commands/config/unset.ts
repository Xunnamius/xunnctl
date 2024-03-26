import { ParentConfiguration } from '@black-flag/core';
import { loadFromCliConfig, saveToCliConfig } from 'universe/config-manager';

import { CustomExecutionContext } from 'universe/configure';
import { LogTag, standardSuccessMessage } from 'universe/constant';

import {
  GlobalCliArguments,
  logStartTime,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments & {
  all?: boolean;
  name?: string[];
};

export default async function ({
  debug_,
  log,
  state: { startTime }
}: CustomExecutionContext) {
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>({
    name: {
      array: true,
      description: 'The names of one or more options to delete',
      conflicts: ['all']
    },
    all: {
      boolean: true,
      description: 'Delete all stored options',
      conflicts: ['name']
    }
  });

  return {
    aliases: ['u'],
    builder,
    description: 'Remove entirely one or more configuration options',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, name: names, all }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('names (name): %O', names);
        debug('all: %O', all);

        logStartTime({ log, startTime });

        if (all) {
          names = Object.keys(await loadFromCliConfig({ configPath }));
        }

        if (names?.length) {
          await Promise.all(
            names.map(async (name) => {
              return saveToCliConfig({ configPath, key: name, value: undefined });
            })
          );
        }

        log([LogTag.IF_NOT_QUIETED], standardSuccessMessage);
        log(
          [LogTag.IF_NOT_HUSHED],
          `Ensured ${names?.length || 0} configuration option(s) were removed`
        );
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
