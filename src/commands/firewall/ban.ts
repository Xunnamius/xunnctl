import assert from 'node:assert';

import { ChildConfiguration } from '@black-flag/core';

import { loadFromCliConfig } from 'universe/config-manager';
import { CustomExecutionContext } from 'universe/configure';
import { LogTag, standardSuccessMessage } from 'universe/constant';
import { ErrorMessage, TaskError } from 'universe/error';

import { makeCloudflareApiCaller } from 'universe/api/cloudflare/index.js';
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
  comment?: string;
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
      demandOption: true,
      array: true,
      description: 'An ipv4, ipv6, or supported CIDR'
    },
    comment: {
      string: true,
      description: 'Include custom text with the ban comment where applicable'
    }
  });

  return {
    aliases: ['b'],
    builder,
    description: 'Add an IP from the global hostile IP list',
    usage: makeUsageString(),
    handler: withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, ip: targetIps_, comment }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('ip: %O', targetIps_);
        debug('comment: %O', comment);

        const { startTime } = state;

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

        const ipToCidr = makeIpToCidrFn('argument');
        const targetIps = Array.from(
          new Set(targetIps_.map((target) => ipToCidr({ ip: target }).cidr.toString()))
        );

        taskManager.add(
          [
            withStandardListrTaskConfig({
              initialTitle: `Adding ${targetIps.length} ips to Cloudflare blocklist...`,
              apiCallerFactory: makeCloudflareApiCaller,
              configPath,
              debug,
              async callback({ thisTask, api }) {
                try {
                  if (targetIps.length) {
                    await api.addHostileIps({
                      accountId,
                      listId: hostileIpListId,
                      targetIps,
                      comment
                    });
                  }

                  thisTask.title = `Added ${targetIps.length} ips to Cloudflare blocklist`;
                } catch (error) {
                  throw new TaskError('failed to add ip to Cloudflare blocklist', {
                    cause: error
                  });
                }
              }
            })
          ],
          { concurrent: false }
        );

        await taskManager.runAll();

        genericLogger([LogTag.IF_NOT_QUIETED], standardSuccessMessage);
      }
    )
  } satisfies ChildConfiguration<CustomCliArguments, CustomExecutionContext>;
}
