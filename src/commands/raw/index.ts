import assert from 'node:assert';

import { $executionContext, ParentConfiguration } from '@black-flag/core';

import { CustomExecutionContext } from 'universe/configure';

const choices = {
  confNginxAllowOnlyCloudflare: 'conf.nginx.allowOnlyCloudflare'
} as const;

const configuration: ParentConfiguration<
  { id: (typeof choices)[keyof typeof choices] },
  CustomExecutionContext
> = {
  aliases: ['r'],
  builder: {
    id: {
      demandOption: true,
      string: true,
      description: 'The identifier associated with the target data',
      choices: Object.values(choices)
    }
  },
  description: 'Dump freeform data into stdout',
  handler({ id, [$executionContext]: { log } }) {
    switch (id) {
      case choices.confNginxAllowOnlyCloudflare: {
        log('output goes here!');
        break;
      }

      default: {
        assert.fail(`unrecognized id "${id}"`);
      }
    }
  }
};

export default configuration;
