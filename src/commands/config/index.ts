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

export default function command(executionContext: CustomExecutionContext) {
  const { debug_ } = executionContext;
  const [builder, builderData] = withGlobalOptions<CustomCliArguments>();

  return {
    aliases: ['c'],
    builder,
    description: "Tools to access and mutate this CLI's configuration keys",
    usage: makeUsageString(),
    handler: withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function (argv) {
        const debug = debug_.extend('handler');
        debug('entered handler');
        await (await commandConfigGet(executionContext)).handler(argv);
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
