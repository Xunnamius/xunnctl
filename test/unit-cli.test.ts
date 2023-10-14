import { asMockedFunction } from '@xunnamius/jest-types';

import { protectedImportFactory } from 'testverse/setup';
import { CliError } from 'universe/error';
import {
  DEFAULT_ERROR_EXIT_CODE,
  configureProgram,
  type PreExecutionContext
} from 'universe/index';

const CLI_PATH = 'universe/cli';

jest.mock('universe/index');

const protectedImport = protectedImportFactory(CLI_PATH);
const mockedExecute = jest.fn();
const mockedConfigureProgram = asMockedFunction(configureProgram);

beforeEach(() => {
  mockedExecute.mockImplementation(async () => ({}));
  mockedConfigureProgram.mockImplementation(() => {
    return {
      program: {},
      execute: mockedExecute
    } as unknown as PreExecutionContext;
  });
});

it('executes program on import and exits with 0 upon success', async () => {
  expect.hasAssertions();

  await protectedImport({ expectedExitCode: 0 });

  expect(mockedConfigureProgram.mock.calls).toStrictEqual([[]]);
  expect(mockedExecute.mock.calls).toStrictEqual([[]]);
});

it('exits with DEFAULT_ERROR_EXIT_CODE upon string error type', async () => {
  expect.hasAssertions();

  mockedExecute.mockImplementationOnce(async () => {
    throw 'problems!';
  });

  await protectedImport({ expectedExitCode: DEFAULT_ERROR_EXIT_CODE });

  expect(mockedConfigureProgram.mock.calls).toStrictEqual([[]]);
  expect(mockedExecute.mock.calls).toStrictEqual([[]]);
});

it('exits with DEFAULT_ERROR_EXIT_CODE upon non-CliError error type', async () => {
  expect.hasAssertions();

  mockedExecute.mockImplementationOnce(async () => {
    throw new Error('problems!');
  });

  await protectedImport({ expectedExitCode: DEFAULT_ERROR_EXIT_CODE });

  expect(mockedConfigureProgram.mock.calls).toStrictEqual([[]]);
  expect(mockedExecute.mock.calls).toStrictEqual([[]]);
});

it('exits with specified exit code upon CliError error type', async () => {
  expect.hasAssertions();

  mockedExecute.mockImplementationOnce(async () => {
    throw new CliError('problems!', { suggestedExitCode: 5 });
  });

  await protectedImport({ expectedExitCode: 5 });

  expect(mockedConfigureProgram.mock.calls).toStrictEqual([[]]);
  expect(mockedExecute.mock.calls).toStrictEqual([[]]);
});
