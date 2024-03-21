import { ParentConfiguration } from '@black-flag/core';

import commandConfigGet from 'universe/commands/config/get';
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
    aliases: ['c'],
    builder,
    description: 'Tools to create DNS records',
    usage: makeUsageString(),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function (argv) {
        const debug = debug_.extend('handler');
        debug('entered handler');
        await (await commandConfigGet(executionContext)).handler(argv);
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
