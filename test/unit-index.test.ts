/* eslint-disable jest/no-conditional-in-test */
import { asMockedFunction } from '@xunnamius/jest-types';

import { $executionContext } from 'universe/constant';
import * as universe from 'universe/index';

import {
  configureArguments,
  configureEnvironment,
  configureErrorHandlingEpilogue,
  configureExecutionContext,
  configureExecutionEpilogue,
  configureExecutionPrologue
} from 'universe/configure';

import { expectedCommandsRegex, getFixturePath, runProgram } from 'testverse/helpers';
import { withMocks } from 'testverse/setup';

import type { Arguments, ExecutionContext } from 'types/global';

jest.mock('universe/configure');

jest.mock('universe/constant', (): typeof import('universe/constant') => {
  const universe = jest.requireActual('universe/constant');

  Object.defineProperty(universe, 'CONFIG_MODULES_ROOT_PATH', {
    configurable: true,
    enumerable: true,
    get: () => mockCommandModulesRootPath
  });

  return universe;
});

let mockCommandModulesRootPath: string;

const mockConfigureArguments = asMockedFunction(configureArguments);
const mockConfigureEnvironment = asMockedFunction(configureEnvironment);
const mockConfigureExecutionContext = asMockedFunction(configureExecutionContext);
const mockConfigureExecutionEpilogue = asMockedFunction(configureExecutionEpilogue);
const mockConfigureFinalProgram = asMockedFunction(configureExecutionPrologue);

const mockConfigureErrorHandlingEpilogue = asMockedFunction(
  configureErrorHandlingEpilogue
);

beforeEach(() => {
  mockCommandModulesRootPath = getFixturePath('empty');
  mockConfigureArguments.mockImplementation((argv) => argv);
  mockConfigureEnvironment.mockImplementation(() => ({}));
  mockConfigureExecutionContext.mockImplementation((context) => context);
  mockConfigureFinalProgram.mockImplementation(() => undefined);
  mockConfigureExecutionEpilogue.mockImplementation(async (argv) => argv);
  mockConfigureErrorHandlingEpilogue.mockImplementation(async () => undefined);
});

describe('::configureProgram', () => {
  it('returns PreExecutionContext', async () => {
    expect.hasAssertions();
    await withMocks(async () => {
      const { program, execute, commands, debug, log, state, taskManager, ...rest } =
        await universe.configureProgram();

      expect(program).toBeObject();
      expect(execute).toBeFunction();
      expect(commands).toBeDefined();
      expect(debug).toBeFunction();
      expect(log).toBeFunction();
      expect(state).toBeObject();
      expect(taskManager).toBeObject();
      expect(rest).toBeEmpty();
    });
  });

  it('creates new yargs instance when called with 0 arguments', async () => {
    expect.hasAssertions();
    await withMocks(async () => {
      expect((await universe.configureProgram()).program).toBeObject();
    });
  });

  it('passes through yargs instance when called with 1 argument', async () => {
    expect.hasAssertions();
    await withMocks(async () => {
      const program = universe.makeProgram();

      expect((await universe.configureProgram(program)).program).toBe(program);
    });
  });

  it('throws when configureExecutionContext returns falsy', async () => {
    expect.hasAssertions();
    await withMocks(async () => {
      mockConfigureExecutionContext.mockImplementation(
        () => undefined as unknown as ExecutionContext
      );

      await expect(universe.configureProgram()).rejects.toMatchObject({
        message: expect.stringMatching(/ExecutionContext/)
      });
    });
  });

  describe('::execute', () => {
    it('passes around configured arguments and returns epilogue result', async () => {
      expect.hasAssertions();

      const expectedArgv = ['a', 'b', 'c'];
      const expectedResult = { something: 'else' } as unknown as Arguments<
        Record<string, unknown>
      >;

      await withMocks(async () => {
        mockConfigureArguments.mockImplementation(() => expectedArgv);

        mockConfigureExecutionEpilogue.mockImplementation(async (argv) => {
          expect(argv._).toStrictEqual(expectedArgv);
          return expectedResult;
        });

        await expect((await universe.configureProgram()).execute()).resolves.toBe(
          expectedResult
        );
      });
    });

    it('throws if configureArguments returns falsy', async () => {
      expect.hasAssertions();
      await withMocks(async () => {
        mockConfigureArguments.mockImplementation(
          () => null as unknown as typeof process.argv
        );

        await expect((await universe.configureProgram()).execute()).rejects.toMatchObject(
          {
            message: expect.stringMatching(/typeof process\.argv/)
          }
        );
      });
    });

    it('throws if configureExecutionEpilogue returns falsy', async () => {
      expect.hasAssertions();
      await withMocks(async () => {
        mockConfigureExecutionEpilogue.mockImplementation(
          async () => false as unknown as Arguments<Record<string, unknown>>
        );

        await expect((await universe.configureProgram()).execute()).rejects.toMatchObject(
          {
            message: expect.stringMatching(/Arguments/)
          }
        );
      });
    });
  });

  describe('command module auto-discovery', () => {
    it('supports different module types', async () => {
      expect.hasAssertions();

      mockCommandModulesRootPath = getFixturePath('different-module-types');

      await withMocks(async ({ logSpy }) => {
        await expect(
          runProgram('exports-function --exports-function')
        ).resolves.toStrictEqual(
          expect.objectContaining({
            exportsFunction: 1,
            handled_by: getFixturePath(['different-module-types', 'exports-function.js'])
          })
        );

        await expect(runProgram('exports-object test-positional')).resolves.toStrictEqual(
          expect.objectContaining({
            testPositional: 'test-positional',
            handled_by: getFixturePath(['different-module-types', 'exports-object.js'])
          })
        );

        const result = await runProgram('--help');

        expect(logSpy.mock.calls).toStrictEqual([
          [
            expect.stringMatching(
              expectedCommandsRegex([
                'exports-function',
                'exports-object test-positional'
              ])
            )
          ]
        ]);

        const executionContext = result[$executionContext] as ExecutionContext & {
          effected: true;
          affected: true;
        };

        expect(executionContext.affected).toBeTrue();
      });
    });

    it('ignores empty', async () => {
      expect.hasAssertions();

      mockCommandModulesRootPath = getFixturePath('empty');

      await withMocks(async ({ logSpy }) => {
        await runProgram('--help');

        expect(logSpy).toBeCalledWith(expect.stringContaining('Options:'));
        expect(logSpy).not.toBeCalledWith(expect.stringContaining('Commands:'));
      });
    });

    it('delegates parsing and handling to deeply nested commands', async () => {
      expect.hasAssertions();

      mockCommandModulesRootPath = getFixturePath('nested-depth');

      await withMocks(async ({ logSpy }) => {
        await expect(
          runProgram('good1 good2 good3 command --command')
        ).resolves.toStrictEqual(
          expect.objectContaining({
            command: 1,
            handled_by: getFixturePath([
              'nested-depth',
              'good1',
              'good2',
              'good3',
              'command.js'
            ])
          })
        );

        await expect(runProgram('good1 good2 good3 --good3')).resolves.toStrictEqual(
          expect.objectContaining({
            good3: 1,
            handled_by: getFixturePath([
              'nested-depth',
              'good1',
              'good2',
              'good3',
              'index.js'
            ])
          })
        );

        await expect(runProgram('good1 good2 --good2')).resolves.toStrictEqual(
          expect.objectContaining({
            good2: 1,
            handled_by: getFixturePath(['nested-depth', 'good1', 'good2', 'index.js'])
          })
        );

        await expect(runProgram('good1 --good1')).resolves.toStrictEqual(
          expect.objectContaining({
            good1: 1,
            handled_by: getFixturePath(['nested-depth', 'good1', 'index.js'])
          })
        );

        await expect(runProgram('--nested-depth')).resolves.toStrictEqual(
          expect.objectContaining({
            nestedDepth: 1,
            'nested-depth': 1,
            handled_by: getFixturePath(['nested-depth', 'index.js'])
          })
        );

        await runProgram('--help');
        await runProgram('good1 --help');
        await runProgram('good1 good2 --help');
        await runProgram('good1 good2 good3 --help');
        await runProgram('good1 good2 good3 command --help');

        expect(logSpy.mock.calls).toStrictEqual([
          [expect.stringMatching(expectedCommandsRegex(['good1']))],
          [
            expect.stringMatching(
              expectedCommandsRegex(['good', 'good2'], 'xunnctl good1')
            )
          ],
          [
            expect.stringMatching(
              expectedCommandsRegex(['good', 'good3'], 'xunnctl good1 good2')
            )
          ],
          [
            expect.stringMatching(
              expectedCommandsRegex(['command'], 'xunnctl good1 good2 good3')
            )
          ],
          [expect.not.stringContaining('Commands:')]
        ]);
      });
    });

    it.todo('supports --help on deeply nested commands');
  });
});
