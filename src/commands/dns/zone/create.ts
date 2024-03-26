import assert from 'node:assert';

import { ParentConfiguration } from '@black-flag/core';

import { ExtendedDebugger } from 'multiverse/rejoinder';
import { loadFromCliConfig } from 'universe/config-manager';
import { CustomExecutionContext } from 'universe/configure';
import { LogTag, standardSuccessMessage } from 'universe/constant';
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

import { makeCloudflareApiCaller } from 'universe/api/cloudflare/index.js';

// ! Don't forget to update update.ts if adding to the zone creation process!

export type CustomCliArguments = GlobalCliArguments & {
  apex?: string[];
};

/**
 * The meat and potatoes of creating a new DNS zone.
 *
 * ! Don't forget to update update.ts if adding to the zone creation process!
 *
 * @internal
 */
export async function doDnsZoneInitialization({
  zoneId,
  withLocalErrorReporting,
  api,
  mainZoneId,
  zoneName,
  wafBlockHostileIpListName,
  wafBlockHostileIpRuleName,
  firewallPhaseName
}: {
  zoneId: string;
  withLocalErrorReporting: Awaited<ReturnType<typeof makeLocalErrorReportingWrapper>>;
  debug: ExtendedDebugger;
  api: Awaited<ReturnType<typeof makeCloudflareApiCaller>>;
  mainZoneId: string;
  zoneName: string;
  wafBlockHostileIpListName: string;
  wafBlockHostileIpRuleName: string;
  firewallPhaseName: string;
}) {
  return Promise.all(
    [
      async function () {
        const subject = 'root CNAME record';
        await withLocalErrorReporting(subject, function () {
          return api.createDnsCnameRecord({
            zoneId,
            domainName: '@',
            redirectToHostname: 'ergodark.com',
            proxied: true
          });
        });
      },
      async function () {
        await withLocalErrorReporting('wildcard CNAME record', function () {
          return api.createDnsCnameRecord({
            zoneId,
            domainName: '*',
            redirectToHostname: '@',
            proxied: true
          });
        });
      },
      async function () {
        await withLocalErrorReporting('MX record', function () {
          return api.createDnsMxRecord({
            zoneId,
            domainName: '@',
            mailHostname: 'mail.ergodark.com'
          });
        });
      },
      async function () {
        await withLocalErrorReporting('mail CNAME record', function () {
          return api.createDnsCnameRecord({
            zoneId,
            domainName: 'mail',
            redirectToHostname: 'mail.ergodark.com',
            proxied: false
          });
        });
      },
      // async function () {
      //   await withLocalErrorReporting('ACME mail CNAME record', function () {
      //     return api.createDnsCnameRecord({
      //       zoneId,
      //       domainName: '_acme-challenge.mail',
      //       redirectToHostname: '_acme-challenge.darkgray.org',
      //       proxied: false
      //     });
      //   });
      // },
      async function () {
        await withLocalErrorReporting('smtp CNAME record', function () {
          return api.createDnsCnameRecord({
            zoneId,
            domainName: 'smtp',
            redirectToHostname: 'smtp.ergodark.com',
            proxied: false
          });
        });
      },
      // async function () {
      //   await withLocalErrorReporting('ACME smtp CNAME record', function () {
      //     return api.createDnsCnameRecord({
      //       zoneId,
      //       domainName: '_acme-challenge.smtp',
      //       redirectToHostname: '_acme-challenge.darkgray.org',
      //       proxied: false
      //     });
      //   });
      // },
      async function () {
        await withLocalErrorReporting('imap CNAME record', function () {
          return api.createDnsCnameRecord({
            zoneId,
            domainName: 'imap',
            redirectToHostname: 'imap.ergodark.com',
            proxied: false
          });
        });
      },
      // async function () {
      //   await withLocalErrorReporting('ACME imap CNAME record', function () {
      //     return api.createDnsCnameRecord({
      //       zoneId,
      //       domainName: '_acme-challenge.imap',
      //       redirectToHostname: '_acme-challenge.darkgray.org',
      //       proxied: false
      //     });
      //   });
      // },
      async function () {
        await withLocalErrorReporting('neutral SPF TXT record', function () {
          return api.createDnsTxtRecord({
            zoneId,
            domainName: '@',
            content: 'v=spf1 mx a ?all'
          });
        });
      },
      async function () {
        await withLocalErrorReporting('letsencrypt CAA records', function () {
          return api.createDnsCaaRecords({ zoneId });
        });
      },
      async function () {
        await withLocalErrorReporting('ADSP DKIM CNAME record', function () {
          return api.createDnsCnameRecord({
            zoneId,
            domainName: '_adsp._domainkey',
            redirectToHostname: '_adsp._domainkey.ergodark.com',
            proxied: false
          });
        });
      },
      async function () {
        await withLocalErrorReporting('default key DKIM CNAME record', function () {
          return api.createDnsCnameRecord({
            zoneId,
            domainName: 'default._domainkey',
            redirectToHostname: 'default._domainkey.ergodark.com',
            proxied: false
          });
        });
      },
      async function () {
        await withLocalErrorReporting('DMARC CNAME record', function () {
          return api.createDnsCnameRecord({
            zoneId,
            domainName: '_dmarc',
            redirectToHostname: '_dmarc.ergodark.com',
            proxied: false
          });
        });
      },
      async function () {
        await withLocalErrorReporting(
          'DMARC reporter TXT record (to main zone)',
          function () {
            return api.createDnsTxtRecord({
              zoneId: mainZoneId,
              domainName: `${zoneName}._report._dmarc`,
              content: 'v=DMARC1'
            });
          }
        );
      },
      async function () {
        await withLocalErrorReporting('WAF fail2ban integration', async function () {
          await api.createDnsZoneCustomFirewallRulesetRule({
            zoneId,
            ruleAction: 'block',
            ruleExpression: `(ip.src in $${wafBlockHostileIpListName})`,
            ruleDescription: wafBlockHostileIpRuleName,
            rulesetPhaseName: firewallPhaseName
          });
        });
      }
      // async function () {
      //   if (zoneName !== 'darkgray.org') {
      //     await withLocalErrorReporting('ACME challenge CNAME record', function () {
      //       return api.createDnsCnameRecord({
      //         zoneId,
      //         domainName: '_acme-challenge',
      //         redirectToHostname: '_acme-challenge.darkgray.org',
      //         proxied: false
      //       });
      //     });
      //   } else {
      //     debug(
      //       '(skipped creating ACME challenge CNAME record for known domain "darkgray.org")'
      //     );
      //   }
      // }
    ].map((fn) => fn())
  );
}

export default async function ({
  log,
  debug_,
  taskManager,
  state
}: CustomExecutionContext) {
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>({
    apex: {
      demandOption: true,
      array: true,
      description: 'Zero or more zone apex domains to create'
    }
  });

  return {
    aliases: ['c'],
    builder,
    description: 'Create and initializes new DNS zones',
    usage: makeUsageString(
      "$1. If a conflicting apex zone already exists, this command will fail. If you're trying to bring an existing zone up to current configuration standards, see `xunnctl dns zone update` instead."
    ),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, apex: apices = [] }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('apex: %O', apices);

        const { startTime } = state;

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

        const zoneCreationTasks = apices.map((zoneName) => {
          return withStandardListrTaskConfig({
            initialTitle: `Creating "${zoneName}"`,
            apiCallerFactory: makeCloudflareApiCaller,
            configPath,
            debug,
            async callback({ api, taskLogger, thisTask: zoneTask }) {
              taskLogger('creating apex zone for %O', zoneName);

              assert(typeof accountId === 'string');

              const zoneId = await api.createDnsZone({
                domainName: zoneName,
                accountId
              });

              debug('new zone created with id %O', zoneId);

              const withLocalErrorReporting = makeLocalErrorReportingWrapper({
                startedPrefix: 'adding ',
                successPrefix: 'added ',
                errorPrefix: 'failed to add ',
                taskLogger
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
        });

        taskManager.add([
          {
            title: `Creating ${apices.length} apex zone${apices.length === 1 ? '' : 's'}...`,
            task: function (_, rootTask) {
              return rootTask.newListr(
                [
                  ...zoneCreationTasks,
                  {
                    task: function () {
                      rootTask.title = `Created ${apices.length} apex zone${apices.length === 1 ? '' : 's'}`;
                    }
                  }
                ],
                { concurrent: false }
              );
            }
          }
        ]);

        await taskManager.runAll();

        log([LogTag.IF_NOT_QUIETED], standardSuccessMessage);

        log.message(
          [LogTag.IF_NOT_HUSHED],
          `Manual action required to finish setup for the following zones:`
        );

        for (const zoneName of apices) {
          log.message(
            [LogTag.IF_NOT_HUSHED],
            `  ${zoneName} - https://dash.cloudflare.com/?to=/:account/${zoneName}/dns/records`
          );
        }
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
