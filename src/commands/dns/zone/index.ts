import { ParentConfiguration } from '@black-flag/core';

import commandZoneRetrieve from 'universe/commands/dns/zone/retrieve';
import { CustomExecutionContext } from 'universe/configure';

import {
  GlobalCliArguments,
  logStartTime,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments;

export default async function (executionContext: CustomExecutionContext) {
  const {
    debug_,
    log,
    state: { startTime }
  } = executionContext;
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>();

  return {
    aliases: ['z'],
    builder,
    description: 'Tools to manage DNS zones',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function (argv) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        logStartTime({ log, startTime });

        await (
          await commandZoneRetrieve(executionContext)
        ).handler({ ...argv, apexAllKnown: true, hush: true });
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
