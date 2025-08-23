import { ParentConfiguration } from '@black-flag/core';
import { CommandNotImplementedError } from '@black-flag/core/util';

import { CustomExecutionContext } from 'universe/configure';

import {
  GlobalCliArguments,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments;

export { command };
export default function command({ debug_ }: CustomExecutionContext) {
  const [builder, builderData] = withGlobalOptions<CustomCliArguments>();

  return {
    aliases: ['d'],
    builder,
    description: 'Tools for DNS-related tasks',
    usage: makeUsageString(),
    handler: withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function () {
        const debug = debug_.extend('handler');
        debug('entered handler');
        throw new CommandNotImplementedError();
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
