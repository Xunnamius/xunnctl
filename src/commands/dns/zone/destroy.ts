import assert from 'node:assert';

import { ChildConfiguration } from '@black-flag/core';
import { loadFromCliConfig } from 'universe/config-manager';

import { CustomExecutionContext } from 'universe/configure';
import { LogTag, standardSuccessMessage } from 'universe/constant';
import { ErrorMessage } from 'universe/error';

import { makeCloudflareApiCaller } from 'universe/api/cloudflare/index.js';
import {
  GlobalCliArguments,
  logStartTime,
  makeLocalErrorReportingWrapper,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling,
  withStandardListrTaskConfig
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments & {
  apex: string;
  purge?: boolean;
  'purge-only'?: boolean;
};

export { command };
export default function command({
  log,
  debug_,
  taskManager,
  state
}: CustomExecutionContext) {
  const [builder, builderData] = withGlobalOptions<CustomCliArguments>({
    apex: {
      demandOption: true,
      string: true,
      implies: ['force'],
      description: 'The name of the zone to destroy'
    },
    force: {
      boolean: true,
      description: 'Disable protections'
    },
    purge: {
      boolean: true,
      description: 'Delete every record before deleting the zone'
    },
    'purge-only': {
      boolean: true,
      description: 'Delete every record but do not delete the zone itself'
    }
  });

  return {
    aliases: ['d'],
    builder,
    description: 'Irrecoverably destroy a DNS zone',
    usage: makeUsageString(),
    handler: withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, apex: zoneName, purge = false, purgeOnly = false }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('apex: %O', zoneName);
        debug('purge: %O', purge);
        debug('purgeOnly (will override purge if true): %O', purgeOnly);

        const { startTime } = state;

        if (purgeOnly) {
          purge = true;
        }

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
            initialTitle: `Deleting apex zone "${zoneName}"...`,
            apiCallerFactory: makeCloudflareApiCaller,
            configPath,
            debug,
            async callback({ api, taskLogger, thisTask: zoneTask }) {
              taskLogger('acquiring zone ID for %O', zoneName);

              const zoneId = await api.getDnsZoneId({ domainName: zoneName });

              const reportingOptions = {
                startedPrefix: 'deleting ',
                successPrefix: 'deleted ',
                errorPrefix: 'failed to delete ',
                taskLogger
              };

              if (zoneId) {
                taskLogger('deleting apex zone for %O (%O)', zoneName, zoneId);

                const withLocalWarningReporting = makeLocalErrorReportingWrapper({
                  ...reportingOptions,
                  ignoreErrors: true
                });

                if (purge) {
                  taskLogger('purging all resource records for this zone first');

                  await withLocalWarningReporting('WAF fail2ban integration', () => {
                    return api.deleteDnsZoneCustomFirewallRuleset({
                      zoneId,
                      rulesetPhaseName: firewallPhaseName
                    });
                  });

                  await Promise.all(
                    (await api.getDnsRecords({ zoneId })).map(
                      async ({ name, id: recordId, type }) => {
                        await withLocalWarningReporting(
                          `[${type}] ${name} (${recordId})`,
                          () => api.deleteDnsRecord({ zoneId, recordId })
                        );
                      }
                    )
                  );
                }

                if (purgeOnly) {
                  debug('skipped deleting zone (due to purge-only)');
                } else {
                  await api.deleteDnsZone({ zoneId });
                  debug('zone deleted successfully');
                }

                await finishDeletion();
                zoneTask.title = `Deleted apex zone "${zoneName}"`;
              } else {
                await finishDeletion();
                zoneTask.title = `Deleted apex zone "${zoneName}" (was already deleted)`;
              }

              async function finishDeletion() {
                const withLocalErrorReporting =
                  makeLocalErrorReportingWrapper(reportingOptions);

                const targetRecordName = `${zoneName}._report._dmarc.ergodark.com`;

                taskLogger(
                  'acquiring DMARC reporter TXT record ID for %O',
                  targetRecordName
                );

                const targetRecordId = await api.getDnsRecordId({
                  zoneId: mainZoneId as string,
                  fullRecordName: targetRecordName,
                  recordType: 'txt'
                });

                if (targetRecordId) {
                  await withLocalErrorReporting(
                    'DMARC reporter TXT record from main zone',
                    function () {
                      return api.deleteDnsRecord({
                        zoneId: mainZoneId as string,
                        recordId: targetRecordId
                      });
                    }
                  );
                } else {
                  taskLogger('DMARC reporter TXT record was not found');
                }
              }
            }
          })
        ]);

        await taskManager.runAll();

        log([LogTag.IF_NOT_QUIETED], standardSuccessMessage);
      }
    )
  } satisfies ChildConfiguration<CustomCliArguments, CustomExecutionContext>;
}
