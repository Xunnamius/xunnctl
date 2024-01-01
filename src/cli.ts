#!/usr/bin/env node

import { join } from 'node:path';

import { runProgram } from '@black-flag/core';
import { suppressNodeWarnings } from 'multiverse/suppress-warnings';

import type { CustomExecutionContext } from 'universe/configure';

suppressNodeWarnings('ExperimentalWarning');

/**
 * This is the simple CLI entry point executed directly by node.
 */
export default runProgram<CustomExecutionContext>(
  join(__dirname, 'commands'),
  require('universe/configure')
);
