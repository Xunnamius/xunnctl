import { isNativeError } from 'node:util/types';

import { ParentConfiguration } from '@black-flag/core';
import jmespath from 'jmespath';

import { TAB } from 'multiverse/rejoinder';
import { makeCloudflareApiCaller, type Zone } from 'universe/api/cloudflare/index.js';
import { CustomExecutionContext } from 'universe/configure';
import { $originApi, LogTag } from 'universe/constant';
import { TaskError } from 'universe/error';

import {
  makeDigitalOceanApiCaller,
  type Domain
} from 'universe/api/digitalocean/index.js';

import {
  GlobalCliArguments,
  logStartTime,
  makeUsageString,
  toSpacedSentenceCase,
  withGlobalOptions,
  withGlobalOptionsHandling,
  withStandardListrTaskConfig
} from 'universe/util';

import type { WithOriginalApi } from 'types/global';

export type CustomCliArguments = GlobalCliArguments & {
  apex?: string[];
  apexAllKnown?: boolean;
  localQuery?: string;
};

export { command };
export default async function command({
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
        const results = { zoneApices: [] as WithOriginalApi<Zone | Domain>[] };

        if (localQuery) {
          taskManager.options = Object.assign(taskManager.options || {}, {
            silentRendererCondition: true
          } as typeof taskManager.options);
        } else {
          logStartTime({ log: genericLogger, startTime });
        }

        taskManager.add([
          withStandardListrTaskConfig({
            initialTitle: 'Downloading apex domain zones from Cloudflare...',
            apiCallerFactory: makeCloudflareApiCaller,
            configPath,
            debug,
            async callback({ thisTask, api, taskLogger }) {
              try {
                const zoneApices = (await api.getDnsZones())
                  .filter(({ name }) => {
                    const returnValue = apexAllKnown || apex.includes(name);
                    taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                    return returnValue;
                  })
                  .map<WithOriginalApi<Zone>>((zone_) => {
                    const zone = zone_ as WithOriginalApi<typeof zone_>;
                    zone[$originApi] = 'cloudflare';
                    return zone;
                  });

                thisTask.title = `Downloaded ${zoneApices.length} apex domain zone${zoneApices.length === 1 ? '' : 's'} from Cloudflare`;
                results.zoneApices.push(...zoneApices);
              } catch (error) {
                throw new TaskError('failed to download zones from Cloudflare account', {
                  cause: error
                });
              }
            }
          }),
          withStandardListrTaskConfig({
            initialTitle: 'Downloading apex domain zones from DigitalOcean...',
            apiCallerFactory: makeDigitalOceanApiCaller,
            configPath,
            debug,
            async callback({ thisTask, api, taskLogger }) {
              try {
                const zoneApices = (await api.getDnsZones())
                  .filter(({ name }) => {
                    const returnValue = apexAllKnown || apex.includes(name);
                    taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                    return returnValue;
                  })
                  .map<WithOriginalApi<Domain>>((zone_) => {
                    const zone = zone_ as WithOriginalApi<typeof zone_>;
                    zone[$originApi] = 'digitalocean';
                    return zone;
                  });

                thisTask.title = `Downloaded ${zoneApices.length} apex domain zone${zoneApices.length === 1 ? '' : 's'} from DigitalOcean`;
                results.zoneApices.push(...zoneApices);
              } catch (error) {
                throw new TaskError(
                  'failed to download zones from DigitalOcean account',
                  { cause: error }
                );
              }
            }
          })
        ]);

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
            if (isHushed) {
              genericLogger(
                [LogTag.IF_NOT_SILENCED],
                `[${zone[$originApi] === 'cloudflare' ? 'CF' : 'DO'}] ${zone.name}`
              );
            } else {
              // eslint-disable-next-line unicorn/no-array-reduce
              const suffix = Object.entries(zone).reduce(
                (str, [key, value]) =>
                  `${str}\n${TAB}${toSpacedSentenceCase(key)}: ${JSON.stringify(value)}`,
                ''
              );

              genericLogger(
                [LogTag.IF_NOT_SILENCED],
                `\nZone: ${zone.name}${suffix || `\n${TAB}(no data)`}`
              );
            }
          });

          if (!results.zoneApices.length) {
            genericLogger([LogTag.IF_NOT_SILENCED], '(no data)');
          }
        }
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
