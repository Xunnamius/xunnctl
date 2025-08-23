import { ChildConfiguration } from '@black-flag/core';

import { CustomExecutionContext } from 'universe/configure';
import { LogTag, standardSuccessMessage } from 'universe/constant';
import { ErrorMessage, TaskError } from 'universe/error';

import assert from 'node:assert';
import { HostileIp, makeCloudflareApiCaller } from 'universe/api/cloudflare/index.js';
import { loadFromCliConfig } from 'universe/config-manager';
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
  ip?: string[];
};

export { command };
export default function command({
  log: genericLogger,
  debug_,
  taskManager,
  state
}: CustomExecutionContext) {
  const [builder, builderData] = withGlobalOptions<CustomCliArguments>({
    ip: {
      array: true,
      description: 'An ipv4, ipv6, or supported CIDR'
    }
  });

  return {
    aliases: ['s'],
    builder,
    description: 'Retrieve firewall status information',
    usage: makeUsageString(),
    handler: withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, ip: filterIps_ = [] }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('ip: %O', filterIps_);

        const { isHushed, startTime } = state;
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

                  thisTask.title = `Downloaded hostile ip blocklist from Cloudflare`;
                  results.hostileIps = hostileIps;
                } catch (error) {
                  throw new TaskError(
                    'failed to download hostile ip blocklist from Cloudflare account',
                    { cause: error }
                  );
                }
              }
            })
          ],
          { concurrent: false }
        );

        await taskManager.runAll();

        const ipToCidr = makeIpToCidrFn('argument');
        const filterIpCidrs = filterIps_.map((ip) => ipToCidr({ ip }));

        const hostileIpCidrs = results.hostileIps
          .map(makeIpToCidrFn('WAF blocklist'))
          .sort(({ created_on: a }, { created_on: b }) => {
            return new Date(a).getTime() < new Date(b).getTime() ? -1 : 1;
          });

        let didOutput = false;

        hostileIpCidrs.forEach(function ({
          cidr: hostileIpCidr,
          created_on: createdOn,
          comment
        }) {
          if (
            !filterIpCidrs.length ||
            filterIpCidrs.some(({ cidr: filterIpCidr }) =>
              filterIpCidr.contains(hostileIpCidr.first())
            )
          ) {
            didOutput = true;
            genericLogger(
              [LogTag.IF_NOT_QUIETED],
              isHushed
                ? hostileIpCidr.toString()
                : `[${new Date(createdOn).toLocaleString()}]`.padEnd(25) +
                    ' ' +
                    hostileIpCidr.toString().padEnd(25) +
                    comment
            );
          }
        });

        if (!didOutput) {
          genericLogger('(no data)');
        }

        genericLogger([LogTag.IF_NOT_QUIETED], standardSuccessMessage);
        genericLogger(
          [LogTag.IF_NOT_SILENCED],
          `Total banned ips: ${hostileIpCidrs.length}`
        );
      }
    )
  } satisfies ChildConfiguration<CustomCliArguments, CustomExecutionContext>;
}
