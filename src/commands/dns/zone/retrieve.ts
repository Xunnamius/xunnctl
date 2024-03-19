import { ParentConfiguration } from '@black-flag/core';
import jmespath from 'jmespath';

import { ExtendedLogger, createListrTaskLogger } from 'multiverse/rejoinder';
import { Zone, makeCloudflareApiCaller } from 'universe/api/cloudflare';
import { CustomExecutionContext } from 'universe/configure';
import { LogTag, loggerNamespace } from 'universe/constant';

import {
  GlobalCliArguments,
  ensureAtLeastOneOptionWasGiven,
  logStartTime,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments & {
  apex?: string[];
  apexAllKnown?: boolean;
  query?: string;
};

export default async function ({
  log: genericLogger,
  debug_,
  taskManager,
  state
}: CustomExecutionContext) {
  return {
    aliases: ['r'],
    builder: await withGlobalOptions<CustomCliArguments>({
      apex: {
        array: true,
        description: 'Zero or more zone apex domains'
      },
      'apex-all-known': {
        boolean: true,
        description: 'Include all known zone apex domains'
      },
      query: {
        array: true,
        description: 'A JMESPath query string',
        coerce: (args) => args.join(' ')
      }
    }),
    description: 'Retrieve information about one or more zones',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(async function ({
      configPath,
      apex,
      apexAllKnown,
      query
    }) {
      const debug = debug_.extend('handler');
      debug('entered handler');

      debug('apex', apex);
      debug('apexAllKnown: %O', apexAllKnown);
      debug('query: %O', query);

      ensureAtLeastOneOptionWasGiven({ apex, apexAllKnown });

      const { isHushed, startTime } = state;
      const results: { zoneApices: Zone[] } = { zoneApices: [] };

      if (query) {
        taskManager.options = Object.assign(taskManager.options || {}, {
          silentRendererCondition: () => true
        } as typeof taskManager.options);
      } else {
        logStartTime({ log: genericLogger, startTime });
      }

      taskManager.add([
        {
          title: 'Downloading apex domain list from Cloudflare...',
          retry: { tries: 3, delay: 5000 },
          task: async function (_ctx, thisTask) {
            const logger = createListrTaskLogger({
              namespace: loggerNamespace,
              task: thisTask
            });

            const dns = await getDnsProvider(logger);

            try {
              const zoneApices = (await dns.getAllDnsZones()).filter(
                ({ name }) => apexAllKnown || apex?.includes(name)
              );

              thisTask.title = `Downloaded ${zoneApices.length} apex domains from Cloudflare`;
              results.zoneApices = zoneApices;
            } catch (error) {
              throw new Error('failed to download zones from cloudflare account', {
                cause: error
              });
            }
          }
        }
      ]);

      await taskManager.runAll();

      if (query) {
        // eslint-disable-next-line no-console
        console.log(
          JSON.stringify(results.zoneApices.map((zone) => jmespath.search(zone, query)))
        );
      } else {
        results.zoneApices.forEach((zone) => {
          genericLogger(
            [LogTag.IF_NOT_SILENCED],
            isHushed ? zone.name : `Zone: ${zone.name}\n\tId: ${zone.id}`
          );
        });
      }

      async function getDnsProvider(listrTaskLogger: ExtendedLogger) {
        return makeCloudflareApiCaller({
          configPath,
          debug: debug_,
          log: listrTaskLogger
        });
      }
    })
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
