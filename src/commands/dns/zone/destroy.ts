import assert from 'node:assert';

import { ParentConfiguration } from '@black-flag/core';
import { loadFromCliConfig } from 'universe/config-manager';

import { CustomExecutionContext } from 'universe/configure';
import { standardSuccessMessage } from 'universe/constant';
import { ErrorMessage } from 'universe/error';

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

export default async function ({
  log,
  debug_,
  taskManager,
  state
}: CustomExecutionContext) {
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>({
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
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
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
            configPath,
            debug,
            async callback({ dns, taskLogger, thisTask: zoneTask }) {
              taskLogger('acquiring zone ID for %O', zoneName);

              const zoneId = await dns.getDnsZoneId({ domainName: zoneName });

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
                    return dns.deleteDnsZoneCustomFirewallRuleset({
                      zoneId,
                      rulesetPhaseName: firewallPhaseName
                    });
                  });

                  await Promise.all(
                    (await dns.getDnsRecords({ zoneId })).map(
                      async ({ name, id: recordId, type }) => {
                        await withLocalWarningReporting(
                          `[${type}] ${name} (${recordId})`,
                          () => dns.deleteDnsRecord({ zoneId, recordId })
                        );
                      }
                    )
                  );
                }

                if (purgeOnly) {
                  debug('skipped deleting zone (due to purge-only)');
                } else {
                  await dns.deleteDnsZone({ zoneId });
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

                const targetRecordId = await dns.getDnsRecordId({
                  zoneId: mainZoneId as string,
                  fullDomainName: targetRecordName,
                  type: 'txt'
                });

                if (targetRecordId) {
                  await withLocalErrorReporting(
                    'DMARC reporter TXT record from main zone',
                    function () {
                      return dns.deleteDnsRecord({
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

        log(standardSuccessMessage);
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
