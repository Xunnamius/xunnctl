import { isNativeError } from 'node:util/types';

import { ParentConfiguration } from '@black-flag/core';
import jmespath from 'jmespath';

import { TAB } from 'multiverse/rejoinder';
import { type ResourceRecord } from 'universe/api/cloudflare/index.js';
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
  name?: string;
  type?: string;
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
      implies: ['force'],
      description: 'Include all known zone apex domains'
    },
    force: {
      boolean: true,
      description: 'Disable protections'
    },
    name: {
      string: true,
      description: 'DNS record name (or @ for the zone apex) in Punycode'
    },
    type: {
      string: true,
      description: 'Case-insensitive DNS record type, such as AAAA or mx'
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
    description: 'Retrieve resource record(s) from apex DNS zone(s)',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, apex = [], apexAllKnown, name, type, localQuery }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('apex', apex);
        debug('apexAllKnown: %O', apexAllKnown);
        debug('name: %O', name);
        debug('type: %O', type);
        debug('query: %O', localQuery);

        const { isHushed, isQuieted, startTime } = state;
        const results = {
          zoneApexIds: {} as { [name: string]: string },
          zoneApicesRecords: {} as { [name: string]: ResourceRecord[] }
        };

        if (localQuery) {
          taskManager.options = Object.assign(taskManager.options || {}, {
            silentRendererCondition: true
          } as typeof taskManager.options);
        } else {
          logStartTime({ log: genericLogger, startTime });
        }

        addToTaskManager({
          initialTitle: `Downloading ${apexAllKnown ? 'all' : 'individual'} apex domain ids from Cloudflare...`,
          taskManager,
          configPath,
          debug,
          async callback({ thisTask, dns, taskLogger }) {
            try {
              const zoneApexEntries = (await dns.getDnsZones())
                .filter(({ name }) => {
                  const returnValue = apexAllKnown || apex.includes(name);
                  taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                  return returnValue;
                })
                .map(({ name, id }) => [name, id]);

              const zoneApexIds = Object.fromEntries(zoneApexEntries);

              thisTask.title = `Downloaded ${zoneApexEntries.length} apex domain ids from Cloudflare`;
              results.zoneApexIds = zoneApexIds;
            } catch (error) {
              throw new TaskError('failed to download zones from Cloudflare account', {
                cause: error
              });
            }
          }
        });

        addToTaskManager({
          initialTitle: 'Downloading resource records from Cloudflare...',
          taskManager,
          configPath,
          debug,
          async callback({ thisTask, dns, taskLogger }) {
            try {
              let totalRecordCount = 0;
              const resourceRecordsEntries = await Promise.all(
                Object.entries(results.zoneApexIds).map(async ([zoneName, zoneId]) => {
                  taskLogger('retrieving record for %O (%O)', zoneName, zoneId);
                  const records = await dns.getDnsZoneRecords({ zoneId });
                  totalRecordCount += records.length;
                  return [zoneName, records] as const;
                })
              );

              const resourceRecords = Object.fromEntries(resourceRecordsEntries);

              thisTask.title = `Downloaded ${totalRecordCount} resource record(s) from ${resourceRecordsEntries.length} apex domain(s)`;
              results.zoneApicesRecords = resourceRecords;
            } catch (error) {
              throw new TaskError(
                'failed to download resource records from Cloudflare account',
                { cause: error }
              );
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
                  Object.entries(results.zoneApicesRecords).map(
                    ([zoneName, resourceRecords]) => [
                      zoneName,
                      resourceRecords.map((record) => jmespath.search(record, localQuery))
                    ]
                  )
                )
              )
            );
          } catch (error) {
            throw new Error(
              `JMESPath error: ${isNativeError(error) ? error.message : error}`
            );
          }
        } else {
          Object.entries(results.zoneApicesRecords).forEach(
            ([zoneName, resourceRecords]) => {
              genericLogger(
                [LogTag.IF_NOT_SILENCED],
                `${isHushed ? '' : '\n'}Zone: ${zoneName}${isHushed && !isQuieted ? '\n' : ''}${
                  isQuieted
                    ? ` (${resourceRecords.length} records)`
                    : // eslint-disable-next-line unicorn/no-array-reduce
                      resourceRecords.reduce((str, record) => {
                        const suffix = isHushed
                          ? `${TAB}${TAB}Content: ${record.content}\n`
                          : // eslint-disable-next-line unicorn/no-array-reduce
                            Object.entries(record).reduce((substr, [key, value]) => {
                              return `${substr}\n${TAB}${TAB}${toSpacedSentenceCase(
                                key
                              )}: ${JSON.stringify(value)}`;
                            }, '') || `\n${TAB}${TAB}(no data)`;

                        return (
                          str +
                          `${isHushed ? '' : '\n\n'}${TAB}[${record.type}] ${record.name}${record.proxied ? ' <PROXIED>' : ''}\n` +
                          suffix
                        );
                      }, '') || `\n${TAB}(no data)`
                }`
              );
            }
          );
        }
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
