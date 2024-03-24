import assert from 'node:assert';

import { ParentConfiguration } from '@black-flag/core';

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
  ip?: string[];
};

export default async function ({
  log: genericLogger,
  debug_,
  taskManager,
  state
}: CustomExecutionContext) {
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>({
    ip: {
      demandOption: true,
      array: true,
      description: 'An ipv4, ipv6, or supported CIDR'
    }
  });

  return {
    aliases: ['b'],
    builder,
    description: 'Add an IP from the global hostile IP list',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, ip: targetIps_ = [] }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('ip: %O', targetIps_);

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
              configPath,
              debug,
              async callback({ thisTask, dns }) {
                try {
                  if (targetIps.length) {
                    await dns.addHostileIps({
                      accountId,
                      listId: hostileIpListId,
                      targetIps
                    });
                  }

                  thisTask.title = `Adding ${targetIps.length} ips to Cloudflare blocklist`;
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

        genericLogger(standardSuccessMessage);
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
