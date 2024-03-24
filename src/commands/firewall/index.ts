import { ParentConfiguration } from '@black-flag/core';

import commandFirewallStatus from 'universe/commands/firewall/status';
import { CustomExecutionContext } from 'universe/configure';

import {
  GlobalCliArguments,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments;

export default async function (executionContext: CustomExecutionContext) {
  const { debug_ } = executionContext;
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>();

  return {
    aliases: ['f'],
    builder,
    description: 'Tools to manage firewall state',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function (argv) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        await (
          await commandFirewallStatus(executionContext)
        ).handler({ ...argv, hush: true });
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
