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

export default function command({ debug_ }: CustomExecutionContext) {
  const [builder, builderData] = withGlobalOptions<CustomCliArguments>();

  return {
    aliases: ['r'],
    builder,
    description: 'Tools to create and retrieve DNS records',
    usage: makeUsageString(),
    handler: withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function (_argv) {
        const debug = debug_.extend('handler');
        debug('entered handler');
        throw new CommandNotImplementedError();
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
