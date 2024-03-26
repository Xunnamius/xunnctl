import assert from 'node:assert';

import { ParentConfiguration } from '@black-flag/core';

import { Zone, makeCloudflareApiCaller } from 'universe/api/cloudflare/index.js';
import { doDnsZoneInitialization } from 'universe/commands/dns/zone/create';
import { loadFromCliConfig } from 'universe/config-manager';
import { CustomExecutionContext } from 'universe/configure';
import { standardSuccessMessage } from 'universe/constant';
import { ErrorMessage, TaskError } from 'universe/error';

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
  apex?: string[];
  apexAllKnown?: boolean;
  purgeFirst?: boolean;
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
      description: 'Include all known zone apex domains'
    },
    force: {
      boolean: true,
      description: 'Disable protections'
    },
    'purge-first': {
      boolean: true,
      description: 'Delete pertinent records on the zone before recreating them'
    }
  });

  return {
    aliases: ['u'],
    builder,
    description: 'Reinitialize a DNS zones',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, apex: apices = [], apexAllKnown, purgeFirst }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('apex: %O', apices);
        debug('apexAllKnown: %O', apexAllKnown);
        debug('purgeFirst: %O', purgeFirst);

        const { startTime } = state;
        const results = { zoneApices: [] as Zone[] };

        logStartTime({ log, startTime });

        const accountId = await loadFromCliConfig({ configPath, key: 'cfAccountId' });
        const mainZoneId = await loadFromCliConfig({ configPath, key: 'cfMainZoneId' });

        const wafBlockHostileIpListName = await loadFromCliConfig({
          configPath,
          key: 'cfWafBlockHostileIpListName'
        });

        const wafBlockHostileIpRuleName = await loadFromCliConfig({
          configPath,
          key: 'cfWafBlockHostileIpRuleName'
        });

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

        assert(
          typeof wafBlockHostileIpListName === 'string',
          ErrorMessage.AssertionFailureInvalidConfig('cfWafBlockHostileIpListName')
        );

        assert(
          typeof wafBlockHostileIpRuleName === 'string',
          ErrorMessage.AssertionFailureInvalidConfig('cfWafBlockHostileIpRuleName')
        );

        taskManager.add([
          withStandardListrTaskConfig({
            initialTitle: 'Downloading apex domain zones from Cloudflare...',
            apiCallerFactory: makeCloudflareApiCaller,
            configPath,
            debug,
            async callback({ thisTask, api, taskLogger }) {
              try {
                const zoneApices = (await api.getDnsZones()).filter(({ name }) => {
                  const returnValue = apexAllKnown || apices.includes(name);
                  taskLogger(returnValue ? `KEEP: ${name}` : `DROP: ${name}`);
                  return returnValue;
                });

                thisTask.title = `Downloaded ${zoneApices.length} apex domain zone${zoneApices.length === 1 ? '' : 's'} from Cloudflare`;
                results.zoneApices = zoneApices;
              } catch (error) {
                throw new TaskError('failed to download zones from Cloudflare account', {
                  cause: error
                });
              }
            }
          }),
          {
            title: `Reinitializing ${apices.length} apex zone${apices.length === 1 ? '' : 's'}...`,
            task: function (_, rootTask) {
              return rootTask.newListr(
                [
                  ...results.zoneApices.map(({ name: zoneName, id: zoneId }) => {
                    debug('creating subtask for zone %O (%O)', zoneName, zoneId);

                    return withStandardListrTaskConfig({
                      initialTitle: `Reinitializing "${zoneName}"`,
                      apiCallerFactory: makeCloudflareApiCaller,
                      configPath,
                      debug,
                      async callback({ api, taskLogger, thisTask: zoneTask }) {
                        debug('operating on zone %O (%O)', zoneName, zoneId);

                        if (purgeFirst) {
                          const withLocalErrorReporting = makeLocalErrorReportingWrapper({
                            startedPrefix: 'purging ',
                            successPrefix: 'purged ',
                            errorPrefix: 'failed to purge ',
                            taskLogger,
                            ignoreErrors: true
                          });

                          await doDnsZoneInitializationPrePurge({
                            zoneId,
                            withLocalErrorReporting,
                            api: api,
                            mainZoneId,
                            zoneName,
                            firewallPhaseName
                          });
                        }

                        taskLogger('reinitializing dns zone');

                        await makeLocalErrorReportingWrapper({
                          startedPrefix: 'reinitializing ',
                          successPrefix: 'reinitialized ',
                          errorPrefix: 'failed to reinitialize ',
                          taskLogger
                        })('DNS zone configuration', async function () {
                          await api.reinitializeDnsZone({ zoneId });
                        });

                        const withLocalErrorReporting = makeLocalErrorReportingWrapper({
                          startedPrefix: 'adding ',
                          successPrefix: 'added ',
                          errorPrefix: 'failed to add ',
                          taskLogger,
                          ignoreErrors: true
                        });

                        await doDnsZoneInitialization({
                          debug,
                          api,
                          firewallPhaseName,
                          mainZoneId,
                          wafBlockHostileIpListName,
                          wafBlockHostileIpRuleName,
                          withLocalErrorReporting,
                          zoneId,
                          zoneName
                        });

                        zoneTask.title = zoneName;
                      }
                    });
                  }),
                  {
                    task: function () {
                      rootTask.title = `Reinitialized ${apices.length} apex zone${apices.length === 1 ? '' : 's'}${purgeFirst ? ' (purged relevant records first)' : ''}`;
                    }
                  }
                ],
                { concurrent: false }
              );
            }
          }
        ]);

        await taskManager.runAll();

        log(standardSuccessMessage);
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}

/**
 * This is essentially the opposite of {@link doDnsZoneInitialization}.
 *
 * @internal
 */
export async function doDnsZoneInitializationPrePurge({
  zoneId,
  withLocalErrorReporting,
  api,
  mainZoneId,
  zoneName,
  firewallPhaseName
}: {
  zoneId: string;
  withLocalErrorReporting: Awaited<ReturnType<typeof makeLocalErrorReportingWrapper>>;
  api: Awaited<ReturnType<typeof makeCloudflareApiCaller>>;
  mainZoneId: string;
  zoneName: string;
  firewallPhaseName: string;
}) {
  return Promise.all(
    [
      async function () {
        const subject = 'root CNAME record';
        await withLocalErrorReporting(subject, async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: zoneName,
            type: 'cname'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      async function () {
        await withLocalErrorReporting('wildcard CNAME record', async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: `*.${zoneName}`,
            type: 'cname'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      async function () {
        await withLocalErrorReporting('MX record', async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: zoneName,
            type: 'mx'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      async function () {
        await withLocalErrorReporting('mail CNAME record', async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: `mail.${zoneName}`,
            type: 'cname'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      // async function () {
      //   await withLocalErrorReporting('ACME mail CNAME record', async function () {
      //     const recordId = await api.getDnsRecordId({
      //       zoneId,
      //       fullRecordName: `_acme-challenge.mail.${zoneName}`,
      //       type: 'cname'
      //     });

      //     if (recordId) {
      //       return api.deleteDnsRecord({ zoneId, recordId });
      //     }
      //   });
      // },
      async function () {
        await withLocalErrorReporting('smtp CNAME record', async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: `smtp.${zoneName}`,
            type: 'cname'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      // async function () {
      //   await withLocalErrorReporting('ACME smtp CNAME record', async function () {
      //     const recordId = await api.getDnsRecordId({
      //       zoneId,
      //       fullRecordName: `_acme-challenge.smtp.${zoneName}`,
      //       type: 'cname'
      //     });

      //     if (recordId) {
      //       return api.deleteDnsRecord({ zoneId, recordId });
      //     }
      //   });
      // },
      async function () {
        await withLocalErrorReporting('imap CNAME record', async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: `imap.${zoneName}`,
            type: 'cname'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      // async function () {
      //   await withLocalErrorReporting('ACME imap CNAME record', async function () {
      //     const recordId = await api.getDnsRecordId({
      //       zoneId,
      //       fullRecordName: `_acme-challenge.imap.${zoneName}`,
      //       type: 'cname'
      //     });

      //     if (recordId) {
      //       return api.deleteDnsRecord({ zoneId, recordId });
      //     }
      //   });
      // },
      async function () {
        await withLocalErrorReporting('neutral SPF TXT record', async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: zoneName,
            type: 'txt'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      async function () {
        await withLocalErrorReporting('letsencrypt CAA records', async function () {
          const recordIds = (
            await api.getDnsRecords({
              zoneId,
              recordName: zoneName,
              recordType: 'caa'
            })
          ).map(({ id }) => id);

          if (recordIds.length) {
            return void (await Promise.all(
              recordIds.map((recordId) => {
                return api.deleteDnsRecord({ zoneId, recordId });
              })
            ));
          }
        });
      },
      async function () {
        await withLocalErrorReporting('ADSP DKIM CNAME record', async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: `_adsp._domainkey.${zoneName}`,
            type: 'cname'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      async function () {
        await withLocalErrorReporting('default key DKIM CNAME record', async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: `default._domainkey.${zoneName}`,
            type: 'cname'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      async function () {
        await withLocalErrorReporting('DMARC CNAME record', async function () {
          const recordId = await api.getDnsRecordId({
            zoneId,
            fullRecordName: `_dmarc.${zoneName}`,
            type: 'cname'
          });

          if (recordId) {
            return api.deleteDnsRecord({ zoneId, recordId });
          }
        });
      },
      async function () {
        await withLocalErrorReporting(
          'DMARC reporter TXT record (to main zone)',
          async function () {
            const recordId = await api.getDnsRecordId({
              zoneId: mainZoneId,
              fullRecordName: `${zoneName}._report._dmarc.ergodark.com`,
              type: 'txt'
            });

            if (recordId) {
              return api.deleteDnsRecord({ zoneId: mainZoneId, recordId });
            }
          }
        );
      },
      async function () {
        await withLocalErrorReporting('WAF fail2ban integration', async function () {
          return api.deleteDnsZoneCustomFirewallRuleset({
            zoneId,
            rulesetPhaseName: firewallPhaseName
          });
        });
      }
      // async function () {
      //   await withLocalErrorReporting('ACME challenge CNAME record', async function () {
      //     const recordId = await api.getDnsRecordId({
      //       zoneId,
      //       fullRecordName: `_acme-challenge.${zoneName}`,
      //       type: 'cname'
      //     });

      //     if (recordId) {
      //       return api.deleteDnsRecord({ zoneId, recordId });
      //     }
      //   });
      // }
    ].map((fn) => fn())
  );
}
