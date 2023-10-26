/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jest/no-conditional-in-test */

// * These tests ensure index exports function as expected

import { $executionContext, CliError, FrameworkExitCode } from 'multiverse/black-flag';
import { withMocks } from 'testverse/setup';

import * as bf from 'multiverse/black-flag';
import * as bf_discover from 'multiverse/black-flag/src/discover';

import {
  expectedCommandsRegex,
  getFixturePath
} from 'multiverse/black-flag/test/helpers';

import type { Arguments, ExecutionContext } from 'multiverse/black-flag';

describe('::configureProgram', () => {
  it('returns PreExecutionContext', async () => {
    expect.hasAssertions();
    await withMocks(async () => {
      const { program, execute, commands, debug, state, ...rest } =
        await bf.configureProgram();

      expect(program).toBeObject();
      expect(execute).toBeFunction();
      expect(commands).toBeDefined();
      expect(debug).toBeFunction();
      expect(state).toBeObject();
      expect(state).toHaveProperty('rawArgv');
      expect(state).toHaveProperty('initialTerminalWidth');
      expect(rest).toBeEmpty();
    });
  });

  it('creates new yargs instance when called with 0 arguments', async () => {
    expect.hasAssertions();

    await withMocks(async () => {
      expect((await bf.configureProgram()).program).toBeObject();
    });
  });

  it('creates executable instance with default configuration hooks when called with 0 arguments', async () => {
    expect.hasAssertions();

    await withMocks(async ({ logSpy }) => {
      await expect(
        (await bf.configureProgram()).execute(['--help'])
      ).resolves.toBeDefined();
      expect(logSpy.mock.calls).toStrictEqual([
        [expect.stringMatching(/^[^-]+--help[^-]+--version[^-]+$/)]
      ]);
    });
  });

  it('does not attempt command auto-discovery when called with 0 arguments', async () => {
    expect.hasAssertions();

    const discoverSpy = jest
      .spyOn(bf_discover, 'discoverCommands')
      .mockImplementation(() => undefined as any);

    await withMocks(async () => {
      await bf.configureProgram();
      expect(discoverSpy.mock.calls).toHaveLength(0);
    });
  });

  it('attempts command auto-discovery when called with >=1 argument', async () => {
    expect.hasAssertions();

    const discoverSpy = jest
      .spyOn(bf_discover, 'discoverCommands')
      .mockImplementation(() => undefined as any);

    await withMocks(async () => {
      await bf.configureProgram('/does-not-exist');
      expect(discoverSpy.mock.calls).toHaveLength(1);
    });
  });

  it('outputs explicit help text to stdout and implicit to stderr', async () => {
    expect.hasAssertions();

    await withMocks(async ({ logSpy, errorSpy }) => {
      const { program, execute } = await bf.configureProgram();
      program.strict(true);

      await execute(['--help']);

      expect(logSpy.mock.calls).toHaveLength(1);
      expect(errorSpy.mock.calls).toHaveLength(0);

      await execute(['--bad']);

      expect(logSpy.mock.calls).toHaveLength(1);
      expect(errorSpy.mock.calls).toStrictEqual([
        expect.arrayContaining([expect.stringContaining('--help')]),
        [],
        expect.arrayContaining([expect.stringContaining('bad')])
      ]);
    });
  });

  it('throws when configureExecutionContext returns falsy', async () => {
    expect.hasAssertions();

    await withMocks(async () => {
      await expect(
        bf.configureProgram(undefined, {
          configureExecutionContext: () => undefined as any
        })
      ).rejects.toMatchObject({
        message: expect.stringMatching(/ExecutionContext/)
      });
    });
  });

  describe('::execute', () => {
    it('passes around configured arguments and returns epilogue result', async () => {
      expect.hasAssertions();

      const expectedArgv = ['a', 'b', 'c'];
      const expectedResult = { something: 'else' } as unknown as Arguments;

      await withMocks(async () => {
        mockConfigureArguments.mockImplementation(() => expectedArgv);

        mockConfigureExecutionEpilogue.mockImplementation(async (argv) => {
          expect(argv._).toStrictEqual(expectedArgv);
          return expectedResult;
        });

        await expect((await bf.configureProgram()).execute()).resolves.toBe(
          expectedResult
        );
      });
    });

    it('throws if configureArguments returns falsy', async () => {
      expect.hasAssertions();

      await withMocks(async () => {
        await expect(
          (
            await bf.configureProgram(undefined, {
              configureArguments: () => undefined as any
            })
          ).execute(['--help'])
        ).rejects.toMatchObject({
          message: expect.stringMatching(/typeof process\.argv/)
        });
      });
    });

    it('throws if configureExecutionEpilogue returns falsy', async () => {
      expect.hasAssertions();

      await withMocks(async () => {
        await expect(
          (
            await bf.configureProgram(undefined, {
              configureExecutionEpilogue: () => undefined as any
            })
          ).execute(['--vex'])
        ).rejects.toMatchObject({
          message: expect.stringMatching(/Arguments/)
        });
      });
    });
  });

  describe('<command module auto-discovery>', () => {
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

      await withMocks(async () => {
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
      });
    });

    it('supports --help on deeply nested commands', async () => {
      expect.hasAssertions();

      mockCommandModulesRootPath = getFixturePath('nested-depth');

      await withMocks(async ({ logSpy }) => {
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

    it('ensures parent commands and child commands of the same name do not interfere', async () => {
      expect.hasAssertions();
    });

    it('disables yargs::argv magic getter (always returns undefined)', async () => {
      expect.hasAssertions();
    });

    it('disables strictness constraints on parent commands', async () => {
      expect.hasAssertions();
    });

    it('enables strictness constraints on (pure) child commands', async () => {
      expect.hasAssertions();
    });

    it('reports non-cli errors as expected', async () => {
      expect.hasAssertions();
    });

    it('reports cli errors (and descendants) as expected', async () => {
      expect.hasAssertions();
    });

    it('reports causal chains for deep cli errors', async () => {
      expect.hasAssertions();
    });

    it('gracefully sets exit code to 0 without fuss when handling a GracefulEarlyExitError', async () => {
      expect.hasAssertions();
    });
  });
});

describe('::runProgram', () => {
  it('executes program and sets exit code to 0 upon success', async () => {
    expect.hasAssertions();

    await withMocks(async () => {
      await bf.runProgram();
    });
  });

  it('exits with FrameworkExitCode.DEFAULT_ERROR upon string error type', async () => {
    expect.hasAssertions();

    mockedExecute.mockImplementationOnce(async () => {
      throw 'problems!';
    });

    await protectedImport({ expectedExitCode: FrameworkExitCode.DEFAULT_ERROR });

    expect(mockedConfigureProgram.mock.calls).toStrictEqual([[]]);
    expect(mockedExecute.mock.calls).toStrictEqual([[]]);
  });

  it('exits with FrameworkExitCode.DEFAULT_ERROR upon non-CliError error type', async () => {
    expect.hasAssertions();

    mockedExecute.mockImplementationOnce(async () => {
      throw new Error('problems!');
    });

    await protectedImport({ expectedExitCode: FrameworkExitCode.DEFAULT_ERROR });

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
});
