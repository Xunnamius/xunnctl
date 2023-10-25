import { join } from 'node:path';

import { runProgram } from 'multiverse/black-flag';
import { suppressNodeWarnings } from 'multiverse/suppress-warnings';

import type { CustomExecutionContext } from 'universe/configure';

suppressNodeWarnings('ExperimentalWarning');

/**
 * This is the simple CLI entry point executed directly by node. When built with
 * babel, the file containing this function may get a shebang and `chmod +x`-ed.
 */
export default runProgram<CustomExecutionContext>(
  join(__dirname, 'command'),
  import('universe/configure')
);
