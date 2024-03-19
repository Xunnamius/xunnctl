// * https://www.npmjs.com/package/npm-check-updates#configuration-files

module.exports = {
  reject: [
    // ? Pin the CJS version of execa
    'execa',
    // ? Pin the CJS version of execa
    'alpha-sort',
    // ? Pin the CJS version of execa
    'supports-color'
  ]
};
