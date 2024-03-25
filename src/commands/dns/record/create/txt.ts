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
  content: string;
  ttl?: number;
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
    content: {
      demandOption: true,
      string: true,
      description: 'Text content for the record'
    },
    ttl: {
      number: true,
      description: 'A valid time-to-live value'
    }
  });

  return {
    aliases: ['TXT'],
    builder,
    description: 'Create a DNS "TXT" resource record',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({
        configPath,
        apex: apices = [],
        apexAllKnown,
        name: domainName,
        content,
        ttl
      }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('apex: %O', apices);
        debug('apexAllKnown: %O', apexAllKnown);
        debug('name: %O', domainName);
        debug('content: %O', content);
        debug('ttl: %O', ttl);

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
            initialTitle: `Creating "TXT" resource records in selected zones...`,
            configPath,
            debug,
            async callback({ dns, taskLogger, thisTask: zoneTask }) {
              const count = Object.keys(results.zoneApexIds).length;
              zoneTask.title = `Creating "TXT" resource records in ${count} zones...`;

              try {
                let totalRecordCount = 0;

                await Promise.all(
                  Object.entries(results.zoneApexIds).map(async ([zoneName, zoneId]) => {
                    taskLogger('creating TXT record for %O (%O)', zoneName, zoneId);
                    await dns.createDnsTxtRecord({ zoneId, domainName, content, ttl });
                    totalRecordCount += 1;
                  })
                );

                zoneTask.title = `Created ${totalRecordCount} "TXT" resource record${totalRecordCount === 1 ? '' : 's'} in ${count} apex domain(s)`;
              } catch (error) {
                throw new TaskError(
                  'failed to create "TXT" resource record in Cloudflare account',
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
