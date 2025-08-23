import assert from 'node:assert';

import { ParentConfiguration } from '@black-flag/core';

import { makeCloudflareApiCaller } from 'universe/api/cloudflare/index.js';
import { CustomExecutionContext } from 'universe/configure';
import { nginxConfigBottomMatter, nginxConfigTopMatter } from 'universe/constant';
import { ErrorMessage } from 'universe/error';

import {
  GlobalCliArguments,
  makeUsageString,
  withGlobalOptions,
  withGlobalOptionsHandling
} from 'universe/util';

export type CustomCliArguments = GlobalCliArguments & {
  id: (typeof validIdChoices)[keyof typeof validIdChoices];
};

export const validIdChoices = {
  confNginxAllowOnlyCloudflare: 'conf.nginx.allowOnlyCloudflare'
} as const;

export { command };
export default function command({ log, debug_ }: CustomExecutionContext) {
  const [builder, builderData] = withGlobalOptions<CustomCliArguments>({
    id: {
      demandOption: true,
      string: true,
      description: 'The identifier associated with the target data',
      choices: Object.values(validIdChoices)
    }
  });

  return {
    aliases: ['r'],
    builder,
    description: 'Dump freeform data into stdout',
    usage: makeUsageString(),
    handler: withGlobalOptionsHandling<CustomCliArguments>(
      builderData,
      async function ({ id, configPath }) {
        const debug = debug_.extend('handler');
        debug('entered handler');

        switch (id) {
          case validIdChoices.confNginxAllowOnlyCloudflare: {
            await regenerateNginxConfig();
            break;
          }

          default: {
            assert.fail(ErrorMessage.GuruMeditation());
          }
        }

        async function regenerateNginxConfig() {
          const configString = await (await import('get-stdin')).default();
          const rawStartIndex = configString.indexOf(nginxConfigTopMatter);
          const rawEndIndex = configString.indexOf(nginxConfigBottomMatter);

          debug('rawStartIndex: %O', rawStartIndex);
          debug('rawEndIndex: %O', rawEndIndex);

          const startIndex = rawStartIndex === -1 ? 0 : rawStartIndex;

          const endIndex =
            rawEndIndex === -1 ? 0 : rawEndIndex + nginxConfigBottomMatter.length;

          debug('startIndex: %O', startIndex);
          debug('endIndex: %O', endIndex);

          const api = await makeCloudflareApiCaller({
            configPath,
            debug: debug_,
            log
          });

          const ips = await (async () => {
            try {
              return Object.values(await api.getCloudflareIps()).flat();
            } catch (error) {
              throw new Error(ErrorMessage.FailedCloudflareIpFetch(), { cause: error });
            }
          })();

          // eslint-disable-next-line no-console
          console.log(
            `${configString.slice(0, startIndex)}${nginxConfigTopMatter}

# Last regenerated: ${new Date().toLocaleString()}

${ips.map((ip) => `allow ${ip};`).join('\n')}

${nginxConfigBottomMatter}\n${configString.slice(endIndex)}`.trimEnd()
          );
        }
      }
    )
  } satisfies ParentConfiguration<CustomCliArguments, CustomExecutionContext>;
}
