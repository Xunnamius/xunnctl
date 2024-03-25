import { ParentConfiguration } from '@black-flag/core';

import { CustomExecutionContext } from 'universe/configure';
import { standardSuccessMessage } from 'universe/constant';
import { TaskError } from 'universe/error';

import {
  GlobalCliArguments,
  logStartTime,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling,
  withStandardListrTaskConfig
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments & {
  apex?: string[];
  apexAllKnown?: boolean;
  name: string;
  ipv4: string;
  ttl?: number;
  proxied?: boolean;
};

export default async function ({
  log,
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
      implies: ['force'],
      description: 'Create in all known zone apex domains'
    },
    force: {
      boolean: true,
      description: 'Disable protections'
    },
    name: {
      demandOption: true,
      string: true,
      description: 'DNS record name (or @ for the zone apex) in Punycode'
    },
    ipv4: {
      demandOption: true,
      string: true,
      description: 'A valid IPv4 address'
    },
    ttl: {
      number: true,
      description: 'A valid time-to-live value'
    },
    proxied: {
      boolean: true,
      description: 'Proxy the record through Cloudflare'
    }
  });

  return {
    aliases: ['A'],
    builder,
    description: 'Create a DNS "A" resource record',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({
        configPath,
        apex: apices = [],
        apexAllKnown,
        name: domainName,
        ipv4,
        ttl,
        proxied = false
      }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('apex: %O', apices);
        debug('apexAllKnown: %O', apexAllKnown);
        debug('name: %O', domainName);
        debug('ipv4: %O', ipv4);
        debug('ttl: %O', ttl);
        debug('proxied: %O', proxied);

        const { startTime } = state;
        const results = {
          zoneApexIds: {} as { [name: string]: string }
        };

        logStartTime({ log, startTime });

        taskManager.add([
          withStandardListrTaskConfig({
            initialTitle: `Downloading ${apexAllKnown ? 'all' : 'individual'} apex domain ids from Cloudflare...`,
            configPath,
            debug,
            async callback({ thisTask, dns, taskLogger }) {
              try {
                const zoneApexEntries = (await dns.getDnsZones())
                  .filter(({ name }) => {
                    const returnValue = apexAllKnown || apices.includes(name);
                    taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                    return returnValue;
                  })
                  .map(({ name, id }) => [name, id]);

                const zoneApexIds = Object.fromEntries(zoneApexEntries);

                thisTask.title = `Downloaded ${zoneApexEntries.length} apex domain id${zoneApexEntries.length === 1 ? '' : 's'} from Cloudflare`;
                results.zoneApexIds = zoneApexIds;
              } catch (error) {
                throw new TaskError('failed to download zones from Cloudflare account', {
                  cause: error
                });
              }
            }
          }),
          withStandardListrTaskConfig({
            initialTitle: `Creating "A" resource records in selected zones...`,
            configPath,
            debug,
            async callback({ dns, taskLogger, thisTask: zoneTask }) {
              const count = Object.keys(results.zoneApexIds).length;
              zoneTask.title = `Creating "A" resource records in ${count} zones...`;

              try {
                let totalRecordCount = 0;

                await Promise.all(
                  Object.entries(results.zoneApexIds).map(async ([zoneName, zoneId]) => {
                    taskLogger('creating A record for %O (%O)', zoneName, zoneId);

                    await dns.createDnsARecord({
                      zoneId,
                      domainName,
                      ipv4,
                      ttl,
                      proxied
                    });

                    totalRecordCount += 1;
                  })
                );

                zoneTask.title = `Created ${totalRecordCount} "A" resource record${totalRecordCount === 1 ? '' : 's'} in ${count} apex domain(s)`;
              } catch (error) {
                throw new TaskError(
                  'failed to create "A" resource record in Cloudflare account',
                  { cause: error }
                );
              }
            }
          })
        ]);

        await taskManager.runAll();

        log(standardSuccessMessage);
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
