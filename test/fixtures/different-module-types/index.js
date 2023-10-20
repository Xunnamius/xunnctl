// @ts-check
/// <reference path="../index.d.ts"/>

// * Exports async function to test handling async exports...
module.exports = async (context) => {
  const filename = require('node:path').basename(__filename);

  /**
   * @type {Type.RootConfig}
   */
  const commandModule = {
    description: `description for root program ${filename}`,
    builder: (yargs) => {
      return yargs.option(filename.split('.')[0], { boolean: true });
    },
    handler: (argv) => {
      argv.handled_by = __filename;
    }
  };

  // * ... as well as accessing/mutating global context
  context.effected = true;

  return commandModule;
};
