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
    aliases: ['i'],
    builder,
    description: 'Install several privileged commands from a private repository',
    usage: makeUsageString(
      '$1. These commands will be dynamically added to xunnctl, potentially updating existing commands in the process, thus greatly expanding the available commands beyond those listed in this documentation.\n\nThis command is idempotent so long as the contents of said private repository remain unchanged.'
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
