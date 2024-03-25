import assert from 'node:assert';

import { ParentConfiguration } from '@black-flag/core';
import { loadFromCliConfig } from 'universe/config-manager';

import { CustomExecutionContext } from 'universe/configure';
import { standardSuccessMessage } from 'universe/constant';
import { ErrorMessage, TaskError } from 'universe/error';

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
  name?: string;
  searchForName?: boolean;
  type?: string;
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
      description: 'Delete from all known zone apex domains'
    },
    force: {
      boolean: true,
      description: 'Disable protections'
    },
    name: {
      demandOption: ['type'],
      string: true,
      description: 'DNS record name (or @ for the zone apex) in Punycode'
    },
    'search-for-name': {
      boolean: true,
      description: 'Match names starting with --name instead of exact match'
    },
    type: {
      demandOption: ['name'],
      string: true,
      description: 'Case-insensitive DNS record type, such as AAAA or mx'
    }
  });

  return {
    aliases: ['d'],
    builder,
    description: 'Irrecoverably destroy DNS record(s)',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({
        configPath,
        apex: apices = [],
        apexAllKnown,
        name: recordName,
        type: recordType,
        searchForName = false
      }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('apex: %O', apices);
        debug('apexAllKnown: %O', apexAllKnown);
        debug('name: %O', recordName);
        debug('type: %O', recordType);
        debug('searchForName: %O', searchForName);

        const { startTime } = state;
        const results = {
          zoneApexIds: {} as { [name: string]: string }
        };

        logStartTime({ log, startTime });

        const accountId = await loadFromCliConfig({ configPath, key: 'cfAccountId' });
        const mainZoneId = await loadFromCliConfig({ configPath, key: 'cfMainZoneId' });
        const firewallPhaseName = await loadFromCliConfig({
          configPath,
          key: 'cfFirewallPhaseName'
        });

        assert(
          typeof accountId === 'string',
          ErrorMessage.AssertionFailureInvalidConfig('cfAccountId')
        );

        assert(
          typeof mainZoneId === 'string',
          ErrorMessage.AssertionFailureInvalidConfig('cfMainZoneId')
        );

        assert(
          typeof firewallPhaseName === 'string',
          ErrorMessage.AssertionFailureInvalidConfig('cfFirewallPhaseName')
        );

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
            initialTitle: `Downloading resource records from selected zones...`,
            configPath,
            debug,
            async callback({ dns, taskLogger, thisTask: zoneTask }) {
              const count = Object.keys(results.zoneApexIds).length;
              zoneTask.title = `Downloading resource records from ${count} zones...`;

              try {
                let totalRecordCount = 0;

                await Promise.all(
                  Object.entries(results.zoneApexIds).map(async ([zoneName, zoneId]) => {
                    taskLogger(
                      'retrieving and then deleting records for %O (%O)',
                      zoneName,
                      zoneId
                    );

                    const records_ = await dns.getDnsRecords({
                      zoneId,
                      recordName: searchForName ? undefined : recordName,
                      recordType
                    });

                    const records =
                      searchForName && recordName
                        ? records_.filter(({ name }) => name.startsWith(recordName))
                        : records_;

                    await Promise.all(
                      records.map(({ id: recordId }) =>
                        dns.deleteDnsRecord({ zoneId, recordId })
                      )
                    );

                    totalRecordCount += records.length;
                  })
                );

                zoneTask.title = `Deleted ${totalRecordCount} resource record${totalRecordCount === 1 ? '' : 's'} from ${count} apex domain(s)`;
              } catch (error) {
                throw new TaskError(
                  'failed to delete resource records from Cloudflare account',
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
