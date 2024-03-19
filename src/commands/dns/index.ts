import { ParentConfiguration } from '@black-flag/core';
import { CommandNotImplementedError } from '@black-flag/core/util';

import { CustomExecutionContext } from 'universe/configure';

import {
  GlobalCliArguments,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments;

export default async function ({ debug_ }: CustomExecutionContext) {
  return {
    aliases: ['d'],
    builder: await withGlobalOptions<CustomCliArguments>(),
    description: 'Tools for DNS-related tasks',
    handler: await withGlobalOptionsHandling<CustomCliArguments>(async function () {
      const debug = debug_.extend('handler');
      debug('entered handler');
      throw new CommandNotImplementedError();
    })
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
