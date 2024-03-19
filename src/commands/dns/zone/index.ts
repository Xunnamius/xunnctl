import { ParentConfiguration } from '@black-flag/core';

import commandZoneRetrieve from 'universe/commands/dns/zone/retrieve';
import { CustomExecutionContext } from 'universe/configure';

import {
  GlobalCliArguments,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments;

export default async function (executionContext: CustomExecutionContext) {
  const { debug_ } = executionContext;
  return {
    aliases: ['z'],
    builder: await withGlobalOptions<CustomCliArguments>(),
    description: 'Tools to manage DNS zones',
    handler: await withGlobalOptionsHandling<CustomCliArguments>(async function (argv) {
      const debug = debug_.extend('handler');
      debug('entered handler');
      await (
        await commandZoneRetrieve(executionContext)
      ).handler({ ...argv, apexAllKnown: true });
    })
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
