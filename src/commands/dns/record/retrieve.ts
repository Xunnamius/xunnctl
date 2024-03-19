import { ParentConfiguration } from '@black-flag/core';
import { ExtendedLogger, createListrTaskLogger } from 'multiverse/rejoinder';
import { Zone, makeCloudflareApiCaller } from 'universe/api/cloudflare';

import { CustomExecutionContext } from 'universe/configure';
import { loggerNamespace } from 'universe/constant';

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
  name?: string;
  type?: string;
  query?: string;
};

export default async function ({
  log: genericLogger,
  debug_,
  taskManager
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
      name: {
        string: true,
        demandOption: true,
        description: 'DNS record name (or @ for the zone apex) in Punycode'
      },
      type: {
        string: true,
        demandOption: true,
        description: 'Case-insensitive DNS record type, such as AAAA or mx'
      },
      query: {
        array: true,
        description: 'A JMESPath query string',
        coerce: (args) => args.join(' ')
      }
    }),
    description: 'Retrieve resource record from apex DNS zone',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(async function ({
      configPath,
      apex,
      apexAllKnown,
      name,
      type,
      query
    }) {
      const debug = debug_.extend('handler');
      debug('entered handler');

      debug('apex', apex);
      debug('apexAllKnown: %O', apexAllKnown);
      debug('name: %O', name);
      debug('type: %O', type);
      debug('query: %O', query);

      ensureAtLeastOneOptionWasGiven({ apex, apexAllKnown });

      const ctx: { zoneApexNames: Zone[] } = (taskManager.ctx = { zoneApexNames: [] });
      taskManager.add([
        {
          title: 'Downloading apex domain list from Cloudflare',
          retry: { tries: 3, delay: 5000 },
          task: async function (_ctx, thisTask) {
            const logger = createListrTaskLogger({
              namespace: loggerNamespace,
              task: thisTask
            });

            const dns = await getDnsProvider(logger);

            try {
              const zoneApexNames = (await dns.getAllDnsZones()).map((zone) => zone.name);

              thisTask.title = `Downloaded ${zoneApexNames.length} apex domain list from Cloudflare`;
              taskManager.ctx = { zoneApexNames };
            } catch (error) {
              throw new Error('failed to download zones from cloudflare account', {
                cause: error
              });
            }
          }
        }
      ]);

      await taskManager.runAll();

      ctx.zoneApexNames.forEach((zone) => {
        genericLogger(`Zone: ${zone.name}\n\tId: ${zone.id}`);
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
