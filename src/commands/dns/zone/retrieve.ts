import { isNativeError } from 'node:util/types';

import { ParentConfiguration } from '@black-flag/core';
import jmespath from 'jmespath';

import { TAB } from 'multiverse/rejoinder';
import { Zone } from 'universe/api/cloudflare/index.js';
import { CustomExecutionContext } from 'universe/configure';
import { LogTag } from 'universe/constant';
import { TaskError } from 'universe/error';

import {
  GlobalCliArguments,
  addToTaskManager,
  logStartTime,
  makeUsageString,
  toSpacedSentenceCase,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments & {
  apex?: string[];
  apexAllKnown?: boolean;
  localQuery?: string;
};

export default async function ({
  log: genericLogger,
  debug_,
  taskManager,
  state
}: CustomExecutionContext) {
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>({
    apex: {
      demandOption: ['apex-all-known'],
      array: true,
      description: 'Zero or more zone apex domains'
    },
    'apex-all-known': {
      demandOption: ['apex'],
      boolean: true,
      description: 'Include all known zone apex domains'
    },
    'local-query': {
      array: true,
      description: 'A JMESPath query string for querying downloaded result data',
      coerce: (args) => args.join(' ')
    }
  });

  return {
    aliases: ['r'],
    builder,
    description: 'Retrieve information about one or more zones',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, apex = [], apexAllKnown, localQuery }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('apex', apex);
        debug('apexAllKnown: %O', apexAllKnown);
        debug('localQuery: %O', localQuery);

        const { isHushed, startTime } = state;
        const results = { zoneApices: [] as Zone[] };

        if (localQuery) {
          taskManager.options = Object.assign(taskManager.options || {}, {
            silentRendererCondition: true
          } as typeof taskManager.options);
        } else {
          logStartTime({ log: genericLogger, startTime });
        }

        addToTaskManager({
          initialTitle: 'Downloading apex domain zones from Cloudflare...',
          taskManager,
          configPath,
          debug,
          async callback({ thisTask, dns, taskLogger }) {
            try {
              const zoneApices = (await dns.getDnsZones()).filter(({ name }) => {
                const returnValue = apexAllKnown || apex.includes(name);
                taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                return returnValue;
              });

              thisTask.title = `Downloaded ${zoneApices.length} apex domain zones from Cloudflare`;
              results.zoneApices = zoneApices;
            } catch (error) {
              throw new TaskError('failed to download zones from Cloudflare account', {
                cause: error
              });
            }
          }
        });

        await taskManager.runAll();

        if (localQuery) {
          try {
            // eslint-disable-next-line no-console
            console.log(
              JSON.stringify(
                Object.fromEntries(
                  results.zoneApices.map((zone) => [
                    zone.name,
                    jmespath.search(zone, localQuery)
                  ])
                )
              )
            );
          } catch (error) {
            throw new Error(
              `fatal JMESPath error: ${isNativeError(error) ? error.message : error}`
            );
          }
        } else {
          results.zoneApices.forEach((zone) => {
            // eslint-disable-next-line unicorn/no-array-reduce
            const suffix = Object.entries(zone).reduce(
              (str, [key, value]) =>
                `${str}\n${TAB}${toSpacedSentenceCase(key)}: ${JSON.stringify(value)}`,
              ''
            );

            genericLogger(
              [LogTag.IF_NOT_SILENCED],
              isHushed ? zone.name : `Zone: ${zone.name}${suffix || `\n${TAB}(no data)`}`
            );
          });
        }
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
