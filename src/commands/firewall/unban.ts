import assert from 'node:assert';

import { ParentConfiguration } from '@black-flag/core';

import {
  makeCloudflareApiCaller,
  type HostileIp
} from 'universe/api/cloudflare/index.js';
import { loadFromCliConfig } from 'universe/config-manager';
import { CustomExecutionContext } from 'universe/configure';
import { standardSuccessMessage } from 'universe/constant';
import { ErrorMessage, TaskError } from 'universe/error';

import {
  GlobalCliArguments,
  logStartTime,
  makeIpToCidrFn,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling,
  withStandardListrTaskConfig
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments & {
  ip: string[];
};

export default async function ({
  log: genericLogger,
  debug_,
  taskManager,
  state
}: CustomExecutionContext) {
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>({
    ip: {
      array: true,
      description: 'An ipv4, ipv6, or supported CIDR'
    }
  });

  return {
    aliases: ['u'],
    builder,
    description: 'Remove an IP from the global hostile IP list',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, ip: filterIps_ = [] }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('ip: %O', filterIps_);

        const { startTime } = state;
        const results = { hostileIps: [] as HostileIp[] };

        logStartTime({ log: genericLogger, startTime });

        const accountId = await loadFromCliConfig({ configPath, key: 'cfAccountId' });
        const mainZoneId = await loadFromCliConfig({ configPath, key: 'cfMainZoneId' });
        const hostileIpListId = await loadFromCliConfig({
          configPath,
          key: 'cfHostileIpListId'
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
          typeof hostileIpListId === 'string',
          ErrorMessage.AssertionFailureInvalidConfig('cfHostileIpListId')
        );

        taskManager.add(
          [
            withStandardListrTaskConfig({
              initialTitle: 'Downloading hostile ip blocklist from Cloudflare...',
              apiCallerFactory: makeCloudflareApiCaller,
              configPath,
              debug,
              async callback({ thisTask, api }) {
                try {
                  const hostileIps = await api.getHostileIps({
                    accountId,
                    listId: hostileIpListId
                  });

                  thisTask.title = `Downloaded hostile ip blocklist (${hostileIps.length} ip${hostileIps.length === 1 ? '' : 's'}) from Cloudflare`;
                  results.hostileIps = hostileIps;
                } catch (error) {
                  throw new TaskError(
                    'failed to download hostile ip blocklist from Cloudflare account',
                    { cause: error }
                  );
                }
              }
            }),
            withStandardListrTaskConfig({
              initialTitle: 'Removing selected IPs from the blocklist...',
              apiCallerFactory: makeCloudflareApiCaller,
              configPath,
              debug,
              async callback({ thisTask, api }) {
                try {
                  const ipToCidr = makeIpToCidrFn('argument');
                  const filterIpCidrs = Array.from(new Set(filterIps_)).map((ip) =>
                    ipToCidr({ ip })
                  );

                  const hostileIpCidrs = results.hostileIps
                    .map(makeIpToCidrFn('WAF blocklist'))
                    .filter(({ cidr: hostileIpCidr }) => {
                      return (
                        !filterIpCidrs.length ||
                        filterIpCidrs.some(({ cidr: filterIpCidr }) =>
                          filterIpCidr.contains(hostileIpCidr.first())
                        )
                      );
                    });

                  thisTask.title = `Removing ${hostileIpCidrs.length} IP${hostileIpCidrs.length === 1 ? '' : 's'} from the blocklist...`;

                  if (hostileIpCidrs.length) {
                    await api.deleteHostileIps({
                      accountId,
                      listId: hostileIpListId,
                      listItemIds: hostileIpCidrs.map(({ id }) => id)
                    });
                  }

                  thisTask.title = `Removed ${hostileIpCidrs.length} IP${hostileIpCidrs.length === 1 ? '' : 's'} from the blocklist`;
                } catch (error) {
                  throw new TaskError(
                    'failed to remove hostile ips from Cloudflare account blocklist',
                    { cause: error }
                  );
                }
              }
            })
          ],
          { concurrent: false }
        );

        await taskManager.runAll();

        genericLogger(standardSuccessMessage);
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
