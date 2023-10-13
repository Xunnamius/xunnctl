import { configureProgram } from 'universe/index';
import { asMockedFunction } from '@xunnamius/jest-types';
import { protectedImportFactory, withMockedOutput } from './setup';

import type { PreExecutionContext } from 'universe/index';

const CLI_PATH = '../src/cli';

jest.mock('universe/index');

// eslint-disable-next-line jest/require-hook
let mockSilent = false;

const protectedImport = protectedImportFactory(CLI_PATH);
const mockedParse = jest.fn();
const mockedConfigureProgram = asMockedFunction(configureProgram);

beforeEach(() => {
  mockedParse.mockImplementation(async () => ({}));
  mockedConfigureProgram.mockImplementation(
    () =>
      ({
        program: { argv: { silent: mockSilent } },
        parse: mockedParse
      }) as unknown as PreExecutionContext
  );
});

it('executes program on import', async () => {
  expect.hasAssertions();

  await withMockedOutput(async () => {
    await protectedImport();

    expect(mockedConfigureProgram).toBeCalledWith();
    expect(mockedParse).toBeCalledWith();
  });
});

it('errors gracefully on exception (with Error instance)', async () => {
  expect.hasAssertions();

  mockedParse.mockImplementationOnce(async () => {
    throw new Error('problems!');
  });

  await withMockedOutput(async ({ errorSpy }) => {
    await protectedImport({ expectedExitCode: 1 });

    expect(mockedConfigureProgram).toBeCalledWith();
    expect(mockedParse).toBeCalledWith();
    expect(errorSpy).toBeCalledWith(expect.toInclude('problems!'));
  });

  mockedParse.mockReset();
});

it('errors gracefully on exception (with error string)', async () => {
  expect.hasAssertions();

  mockedParse.mockImplementationOnce(() => Promise.reject('problems!'));

  await withMockedOutput(async ({ errorSpy }) => {
    await protectedImport({ expectedExitCode: 1 });

    expect(mockedConfigureProgram).toBeCalledWith();
    expect(mockedParse).toBeCalledWith();
    expect(errorSpy).toBeCalledWith(expect.toInclude('problems!'));
  });

  mockedParse.mockReset();
});

it('respects --silent flag', async () => {
  expect.hasAssertions();

  mockSilent = true;
  mockedParse.mockImplementationOnce(() => Promise.reject('BIG BOY ERROR'));

  await withMockedOutput(async ({ errorSpy }) => {
    await protectedImport({ expectedExitCode: 1 });

    expect(mockedConfigureProgram).toBeCalledWith();
    expect(mockedParse).toBeCalledWith();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  mockedParse.mockReset();
});
