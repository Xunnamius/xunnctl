import { ParentConfiguration } from '@black-flag/core';
import { ExtendedLogger, createListrTaskLogger } from 'multiverse/rejoinder';
import { Zone, makeCloudflareApiCaller } from 'universe/api/cloudflare';

import { CustomExecutionContext } from 'universe/configure';
import { LogTag, loggerNamespace } from 'universe/constant';

import {
  GlobalCliArguments,
  ensureAtLeastOneOptionWasGiven,
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
  state: { isHushed }
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

      const results: { zoneApices: Zone[] } = { zoneApices: [] };

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
              const zoneApices = await dns.getAllDnsZones();

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

      results.zoneApices.forEach((zone) => {
        genericLogger(
          [LogTag.IF_NOT_QUIETED],
          isHushed ? zone.name : `Zone: ${zone.name}\n\tId: ${zone.id}`
        );
      });

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
