import { ChildConfiguration } from '@black-flag/core';
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
    aliases: ['u'],
    builder,
    description: 'Uninstall and/or revert any previously-installed privileged commands',
    usage: makeUsageString(
      '$1. Downloaded commands that overwrote their public versions will be reverted'
    ),
    handler: withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function (_argv) {
        const debug = debug_.extend('handler');
        debug('entered handler');
        throw new CommandNotImplementedError();
      }
    )
  } satisfies ChildConfiguration<CustomCliArguments, CustomExecutionContext>;
}
