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

export default async function (executionContext: CustomExecutionContext) {
  const { debug_ } = executionContext;
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>();

  return {
    aliases: ['u'],
    builder,
    description: 'Uninstall and/or revert any previously-installed privileged commands',
    usage: makeUsageString(
      '$1. Downloaded commands that overwrote their public versions will be reverted'
    ),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function (_argv) {
        const debug = debug_.extend('handler');
        debug('entered handler');
        throw new CommandNotImplementedError();
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
