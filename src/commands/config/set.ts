import { ParentConfiguration } from '@black-flag/core';
import { saveToCliConfig } from 'universe/config-manager';

import { CustomExecutionContext } from 'universe/configure';
import { LogTag, standardSuccessMessage } from 'universe/constant';

import {
  GlobalCliArguments,
  logStartTime,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments & {
  content: string;
  name: string;
};

export { command };
export default async function command({
  log,
  debug_,
  state: { startTime }
}: CustomExecutionContext) {
  const [builder, builderData] = await withGlobalOptions<CustomCliArguments>({
    name: {
      string: true,
      demandOption: true,
      description: 'The name of the configuration option'
    },
    content: {
      alias: ['contents'],
      array: true,
      demandOption: true,
      description: 'The new (valid JSON) value of the configuration option',
      coerce: (args) => args.join(' ')
    }
  });

  return {
    aliases: ['s'],
    builder,
    description: 'Insert or update a configuration option',
    usage: makeUsageString(
      '$1. This value is stored locally and protected with 0660 permissions'
    ),
    handler: await withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ configPath, content, name }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        debug('content: %O', content);
        debug('name: %O', name);

        logStartTime({ log, startTime });

        await saveToCliConfig({ configPath, key: name, value: JSON.parse(content) });

        log([LogTag.IF_NOT_QUIETED], standardSuccessMessage);
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
