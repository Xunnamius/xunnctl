import { ParentConfiguration } from '@black-flag/core';
import { makeCloudflareApiCaller } from 'universe/api/cloudflare/index.js';
import { makeDigitalOceanApiCaller } from 'universe/api/digitalocean/index.js';

import { CustomExecutionContext } from 'universe/configure';
import { LogTag, standardSuccessMessage } from 'universe/constant';
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
          cfZoneApexIds: {} as { [name: string]: string },
          doZoneApices: [] as string[]
        };

        logStartTime({ log, startTime });

        taskManager.add([
          withStandardListrTaskConfig({
            initialTitle: `Downloading ${apexAllKnown ? 'all' : 'individual'} apex domain ids from Cloudflare...`,
            apiCallerFactory: makeCloudflareApiCaller,
            configPath,
            debug,
            async callback({ thisTask, api, taskLogger }) {
              try {
                const counter = (await api.getDnsZones())
                  .filter(({ name }) => {
                    const returnValue = apexAllKnown || apices.includes(name);
                    taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                    return returnValue;
                  })
                  .map(({ name, id }) => {
                    return (results.cfZoneApexIds[name] = id);
                  });

                thisTask.title = `Downloaded ${counter.length} apex domain id${counter.length === 1 ? '' : 's'} from Cloudflare`;
              } catch (error) {
                throw new TaskError('failed to download zones from Cloudflare account', {
                  cause: error
                });
              }
            }
          }),
          withStandardListrTaskConfig({
            initialTitle: `Downloading ${apexAllKnown ? 'all' : 'individual'} apex domain ids from DigitalOcean...`,
            apiCallerFactory: makeDigitalOceanApiCaller,
            configPath,
            debug,
            async callback({ thisTask, api, taskLogger }) {
              try {
                (await api.getDnsZones())
                  .filter(({ name }) => {
                    const returnValue = apexAllKnown || apices.includes(name);
                    taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                    return returnValue;
                  })
                  .forEach(({ name }) => {
                    results.doZoneApices.push(name);
                  });

                thisTask.title = `Downloaded ${results.doZoneApices.length} apex domain id${results.doZoneApices.length === 1 ? '' : 's'} from DigitalOcean`;
              } catch (error) {
                throw new TaskError(
                  'failed to download zones from DigitalOcean account',
                  { cause: error }
                );
              }
            }
          }),
          withStandardListrTaskConfig({
            initialTitle: `Creating "A" resource records in selected Cloudflare zones...`,
            apiCallerFactory: makeCloudflareApiCaller,
            configPath,
            debug,
            async callback({ api, taskLogger, thisTask: zoneTask }) {
              const count = Object.keys(results.cfZoneApexIds).length;
              zoneTask.title = `Creating "A" resource records in ${count} Cloudflare zones...`;

              try {
                let totalRecordCount = 0;

                await Promise.all(
                  Object.entries(results.cfZoneApexIds).map(
                    async ([zoneName, zoneId]) => {
                      taskLogger('creating "A" record for %O (%O)', zoneName, zoneId);

                      await api.createDnsARecord({
                        zoneId,
                        domainName,
                        ipv4,
                        ttl,
                        proxied
                      });

                      totalRecordCount += 1;
                    }
                  )
                );

                zoneTask.title = `Created ${totalRecordCount} "A" resource record${totalRecordCount === 1 ? '' : 's'} in ${count} Cloudflare apex domain${count === 1 ? '' : 's'}`;
              } catch (error) {
                throw new TaskError(
                  'failed to create "A" resource record in Cloudflare account',
                  { cause: error }
                );
              }
            }
          }),
          withStandardListrTaskConfig({
            initialTitle: `Creating "A" resource records in selected DigitalOcean zones...`,
            apiCallerFactory: makeDigitalOceanApiCaller,
            configPath,
            debug,
            async callback({ api, taskLogger, thisTask: zoneTask }) {
              const count = Object.keys(results.doZoneApices).length;
              zoneTask.title = `Creating "A" resource records in ${count} DigitalOcean zones...`;

              try {
                let totalRecordCount = 0;

                await Promise.all(
                  results.doZoneApices.map(async (zoneName) => {
                    taskLogger('creating "A" record for %O', zoneName);

                    await api.createDnsARecord({
                      zoneName,
                      fullRecordName: domainName,
                      ipv4,
                      ttl
                    });

                    totalRecordCount += 1;
                  })
                );

                zoneTask.title = `Created ${totalRecordCount} "A" resource record${totalRecordCount === 1 ? '' : 's'} in ${count} DigitalOcean apex domain${count === 1 ? '' : 's'}`;
              } catch (error) {
                throw new TaskError(
                  'failed to create "A" resource record in DigitalOcean account',
                  { cause: error }
                );
              }
            }
          })
        ]);

        await taskManager.runAll();

        log([LogTag.IF_NOT_QUIETED], standardSuccessMessage);
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
