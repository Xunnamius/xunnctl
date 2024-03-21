import { ParentConfiguration } from '@black-flag/core';

import { loadFromCliConfig } from 'universe/config-manager';
import { CustomExecutionContext } from 'universe/configure';

import {
  GlobalCliArguments,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments & {
  all?: boolean;
  name?: string[];
};

export default async function ({ debug_, state }: CustomExecutionContext) {
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>({
    name: {
      array: true,
      description: 'The names of one or more options to retrieve',
      conflicts: ['all']
    },
    all: {
      boolean: true,
      description: 'Dump the current value of all configuration options',
      conflicts: ['name']
    }
  });

  return {
    aliases: ['g'],
    builder,
    description: 'Dump the value of one or more configuration options into stdout',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, name: names, all }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('names (name): %O', names);
        debug('all: %O', all);

        const log = (name: string, value: unknown) =>
          // eslint-disable-next-line no-console
          state.isSilenced ? undefined : console.log(`${name}=${JSON.stringify(value)}`);

        if (names?.length) {
          await Promise.all(
            names.map(async (name) => {
              log(name, await loadFromCliConfig({ configPath, key: name }));
            })
          );
        } else {
          const configEntries = Object.entries(await loadFromCliConfig({ configPath }));

          if (configEntries.length) {
            for (const [name, value] of configEntries) {
              log(name, value);
            }
          } else {
            debug('no config entries to output');
          }
        }
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
