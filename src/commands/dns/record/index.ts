import { ParentConfiguration } from '@black-flag/core';

import commandRecordRetrieve from 'universe/commands/dns/record/retrieve';
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
    aliases: ['r'],
    builder: await withGlobalOptions<CustomCliArguments>(),
    description: 'Tools to create and retrieve DNS records',
    handler: await withGlobalOptionsHandling<CustomCliArguments>(async function (argv) {
      const debug = debug_.extend('handler');
      debug('entered handler');
      await (
        await commandRecordRetrieve(executionContext)
      ).handler({ ...argv, apexAllKnown: true });
    })
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
