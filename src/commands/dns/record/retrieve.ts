import { isNativeError } from 'node:util/types';

import { ParentConfiguration } from '@black-flag/core';
import jmespath from 'jmespath';

import { TAB } from 'multiverse/rejoinder';
import { CustomExecutionContext } from 'universe/configure';
import { LogTag } from 'universe/constant';
import { TaskError } from 'universe/error';

import {
  isCfResourceRecord,
  makeCloudflareApiCaller,
  type ResourceRecord as CfResourceRecord
} from 'universe/api/cloudflare/index.js';

import {
  makeDigitalOceanApiCaller,
  type ResourceRecord as DoResourceRecord
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

export type CustomCliArguments = GlobalCliArguments & {
  apex?: string[];
  apexAllKnown?: boolean;
  name?: string;
  searchForName?: boolean;
  type?: string;
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
    'search-for-name': {
      boolean: true,
      description: 'Match names starting with --name instead of exact match'
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
      async function ({
        configPath,
        apex = [],
        apexAllKnown,
        name: recordName,
        type: recordType,
        localQuery,
        searchForName = false
      }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('apex', apex);
        debug('apexAllKnown: %O', apexAllKnown);
        debug('name: %O', recordName);
        debug('type: %O', recordType);
        debug('query: %O', localQuery);
        debug('searchForName: %O', searchForName);

        const { isHushed, isQuieted, startTime } = state;
        const results = {
          zoneApexIds: {} as { [name: string]: { id: string; origin: string } },
          zoneApicesRecords: {} as {
            [name: string]: (CfResourceRecord | DoResourceRecord)[];
          }
        };

        if (localQuery) {
          taskManager.options = Object.assign(taskManager.options || {}, {
            silentRendererCondition: true
          } as typeof taskManager.options);
        } else {
          logStartTime({ log: genericLogger, startTime });
        }

        taskManager.add([
          withStandardListrTaskConfig({
            initialTitle: `Downloading ${apexAllKnown ? 'all' : 'individual'} apex domain ids from Cloudflare...`,
            apiCallerFactory: makeCloudflareApiCaller,
            configPath,
            debug,
            async callback({ thisTask, api, taskLogger }) {
              try {
                const zoneApexEntries = (await api.getDnsZones())
                  .filter(({ name }) => {
                    const returnValue = apexAllKnown || apex.includes(name);
                    taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                    return returnValue;
                  })
                  .map(({ name, id }) => {
                    return (results.zoneApexIds[name] = {
                      id,
                      origin: 'cloudflare'
                    });
                  });

                thisTask.title = `Downloaded ${zoneApexEntries.length} apex domain id${zoneApexEntries.length === 1 ? '' : 's'} from Cloudflare`;
              } catch (error) {
                throw new TaskError('failed to download zones from Cloudflare account', {
                  cause: error
                });
              }
            }
          }),
          withStandardListrTaskConfig({
            initialTitle: 'Downloading resource records from Cloudflare...',
            apiCallerFactory: makeCloudflareApiCaller,
            configPath,
            debug,
            async callback({ thisTask, api, taskLogger }) {
              try {
                let totalRecordCount = 0;
                const resourceRecordsEntries = await Promise.all(
                  Object.entries(results.zoneApexIds).map(
                    async ([zoneName, { id: zoneId, origin }]) => {
                      if (origin === 'cloudflare') {
                        taskLogger('retrieving records for %O (%O)', zoneName, zoneId);

                        const records_ = await api.getDnsRecords({
                          zoneId,
                          recordName: searchForName ? undefined : recordName,
                          recordType
                        });

                        const records =
                          searchForName && recordName
                            ? records_.filter(({ name }) => name.startsWith(recordName))
                            : records_;

                        totalRecordCount += records.length;
                        return [zoneName, records] as const;
                      } else {
                        taskLogger('skipped record retrieval for %O', zoneName);
                        return [];
                      }
                    }
                  )
                );

                thisTask.title = `Downloaded ${totalRecordCount} resource record${totalRecordCount === 1 ? '' : 's'} from ${resourceRecordsEntries.length} apex domain(s)`;

                resourceRecordsEntries.forEach(function ([key, value]) {
                  if (key && value) {
                    results.zoneApicesRecords[key] = value;
                  }
                });
              } catch (error) {
                throw new TaskError(
                  'failed to download resource records from Cloudflare account',
                  { cause: error }
                );
              }
            }
          }),
          withStandardListrTaskConfig({
            initialTitle: `Downloading ${apexAllKnown ? 'all' : 'individual'} apex domain names from DigitalOcean...`,
            apiCallerFactory: makeDigitalOceanApiCaller,
            configPath,
            debug,
            async callback({ thisTask, api, taskLogger }) {
              try {
                const zoneApexNames = (await api.getDnsZones())
                  .filter(({ name }) => {
                    const returnValue = apexAllKnown || apex.includes(name);
                    taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                    return returnValue;
                  })
                  .map(({ name }) => {
                    return (results.zoneApexIds[name] = {
                      id: name,
                      origin: 'digitalocean'
                    });
                  });

                thisTask.title = `Downloaded ${zoneApexNames.length} apex domain name${zoneApexNames.length === 1 ? '' : 's'} from DigitalOcean`;
              } catch (error) {
                throw new TaskError(
                  'failed to download zone names from DigitalOcean account',
                  { cause: error }
                );
              }
            }
          }),
          withStandardListrTaskConfig({
            initialTitle: 'Downloading resource records from DigitalOcean...',
            apiCallerFactory: makeDigitalOceanApiCaller,
            configPath,
            debug,
            async callback({ thisTask, api, taskLogger }) {
              try {
                let totalRecordCount = 0;
                let totalApices = 0;

                const resourceRecordsEntries = await Promise.all(
                  Object.entries(results.zoneApexIds).map(
                    async ([zoneName, { origin }]) => {
                      if (origin === 'digitalocean') {
                        taskLogger('retrieving records for %O', zoneName);

                        const records_ = await api.getDnsRecords({
                          zoneName,
                          fullRecordName: searchForName ? undefined : recordName,
                          recordType
                        });

                        const records =
                          searchForName && recordName
                            ? records_.filter(({ name }) => name.startsWith(recordName))
                            : records_;

                        totalRecordCount += records.length;
                        totalApices += 1;
                        return [zoneName, records] as const;
                      } else {
                        taskLogger('skipped record retrieval for %O', zoneName);
                        return [];
                      }
                    }
                  )
                );

                thisTask.title = `Downloaded ${totalRecordCount} resource record${totalRecordCount === 1 ? '' : 's'} from ${totalApices} apex domain${totalApices === 1 ? '' : 's'}`;

                resourceRecordsEntries.forEach(function ([key, value]) {
                  if (key && value) {
                    results.zoneApicesRecords[key] = value;
                  }
                });
              } catch (error) {
                throw new TaskError(
                  'failed to download resource records from DigitalOcean account',
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
                `${isHushed ? '' : '\n'}Zone: ${zoneName} (${results.zoneApexIds[zoneName].origin})${isHushed && !isQuieted ? '\n' : ''}${
                  isQuieted
                    ? ` (${resourceRecords.length} records)`
                    : // eslint-disable-next-line unicorn/no-array-reduce
                      resourceRecords.reduce((str, record) => {
                        const isCf = isCfResourceRecord(record);
                        const suffix = isHushed
                          ? `${TAB}${TAB}Content: ${isCf ? record.content : record.data}\n`
                          : // eslint-disable-next-line unicorn/no-array-reduce
                            Object.entries(record).reduce((substr, [key, value]) => {
                              return `${substr}\n${TAB}${TAB}${toSpacedSentenceCase(
                                key
                              )}: ${JSON.stringify(value)}`;
                            }, '') || `\n${TAB}${TAB}(no data)`;

                        return (
                          str +
                          `${isHushed ? '' : '\n\n'}${TAB}[${record.type}] ${record.name === '@' ? zoneName : record.name}${isCf && record.proxied ? ' <PROXIED>' : ''}\n` +
                          suffix
                        );
                      }, '') || `${isHushed ? '' : '\n'}${TAB}(no data)`
                }`
              );
            }
          );
        }
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
