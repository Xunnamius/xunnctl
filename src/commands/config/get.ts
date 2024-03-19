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

export default async function ({
  debug_,
  state: { isSilenced }
}: CustomExecutionContext) {
  return {
    aliases: ['g'],
    builder: await withGlobalOptions<CustomCliArguments>({
      all: {
        boolean: true,
        description: 'Dump the current value of all configuration options',
        conflicts: ['name']
      },
      name: {
        array: true,
        description: 'The names of one or more options to retrieve',
        conflicts: ['all']
      }
    }),
    description: 'Dump the value of one or more configuration options into stdout',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(async function ({
      configPath,
      name: names,
      all
    }) {
      const debug = debug_.extend('handler');
      debug('entered handler');

      debug('names (name): %O', names);
      debug('all: %O', all);

      // eslint-disable-next-line no-console
      const log = isSilenced ? () => undefined : console.log;

      if (names?.length) {
        await Promise.all(
          names.map(async (name) => {
            const value = JSON.stringify(
              await loadFromCliConfig({ configPath, key: name })
            );

            log(`${name}=${value}`);
          })
        );
      } else {
        const configEntries = Object.entries(await loadFromCliConfig({ configPath }));

        if (configEntries.length) {
          for (const [name, value] of configEntries) {
            // eslint-disable-next-line no-console
            log(`${name}=${value}`);
          }
        } else {
          debug('no config entries to output');
        }
      }
    })
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
