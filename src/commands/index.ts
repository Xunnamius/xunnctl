import { type RootConfiguration } from '@black-flag/core';
import { CommandNotImplementedError } from '@black-flag/core/util';

import { type CustomExecutionContext } from 'universe/configure';

import {
  type GlobalCliArguments,
  makeUsageString,
  withGlobalOptions
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments;

export default function command({ debug_ }: CustomExecutionContext) {
  const [builder, withGlobalOptionsHandling] = withGlobalOptions<CustomCliArguments>(
    undefined,
    // ? hasVersion = true
    true
  );

  return {
    name: 'xunnctl',
    builder,
    description: "Xunnamius's personal switchblade CLI tool",
    usage: makeUsageString(),
    handler: withGlobalOptionsHandling<CustomCliArguments>(async function (_argv) {
      const debug = debug_.extend('handler');
      debug('entered handler');
      throw new CommandNotImplementedError();
    })
  } satisfies RootConfiguration<CustomCliArguments, CustomExecutionContext>;
}
