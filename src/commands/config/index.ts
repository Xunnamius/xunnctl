import { ParentConfiguration } from '@black-flag/core';

import commandConfigGet from 'universe/commands/config/get';
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
    aliases: ['c'],
    builder: await withGlobalOptions<CustomCliArguments>(),
    description: "Tools to access and mutate this CLI's configuration keys",
    handler: await withGlobalOptionsHandling<CustomCliArguments>(async function (argv) {
      const debug = debug_.extend('handler');
      debug('entered handler');
      await (await commandConfigGet(executionContext)).handler(argv);
    })
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
