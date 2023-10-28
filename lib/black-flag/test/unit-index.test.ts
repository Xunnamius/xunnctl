/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jest/no-conditional-in-test */

// * These tests ensure index exports function as expected

import { $executionContext, CliError, FrameworkExitCode } from 'multiverse/black-flag';
import { withMocks } from 'testverse/setup';

import * as bf from 'multiverse/black-flag';
import * as bf_discover from 'multiverse/black-flag/src/discover';
import * as bf_util from 'multiverse/black-flag/util';

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

  it('creates new instance when called with 0 arguments', async () => {
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

  it('returns a non-strict instance if command auto-discovery is disabled', async () => {
    expect.hasAssertions();

    await withMocks(async ({ logSpy, errorSpy }) => {
      const { execute } = await bf.configureProgram();

      await execute(['--help']);

      expect(logSpy.mock.calls).toHaveLength(1);
      expect(errorSpy.mock.calls).toHaveLength(0);

      await execute(['--bad']);

      expect(logSpy.mock.calls).toHaveLength(1);
      expect(errorSpy.mock.calls).toHaveLength(0);
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
        const { execute } = await bf.configureProgram({
          configureArguments() {
            return expectedArgv;
          },
          configureExecutionEpilogue(argv) {
            expect(argv._).toStrictEqual(expectedArgv);
            return expectedResult;
          }
        });

        await expect(execute()).resolves.toBe(expectedResult);
      });
    });

    it('outputs explicit help text to stdout and implicit to stderr with expected exit codes', async () => {
      expect.hasAssertions();

      await withMocks(async ({ logSpy, errorSpy, getExitCode }) => {
        const run = bf_util.makeRunner(getFixturePath('one-file-index'));

        await run('--help');

        expect(getExitCode()).toBe(0);
        expect(logSpy.mock.calls).toHaveLength(1);
        expect(errorSpy.mock.calls).toHaveLength(0);

        await run('--bad');

        expect(getExitCode()).toBe(1);
        expect(logSpy.mock.calls).toHaveLength(1);
        expect(errorSpy.mock.calls).toStrictEqual([
          expect.arrayContaining([expect.stringContaining('--help')]),
          [],
          ['Unknown argument: bad']
        ]);
      });
    });

    it('outputs error messages to console.error via default handler if no error handling configuration hook is provided', async () => {
      expect.hasAssertions();

      const { execute } = await bf.configureProgram({
        configureArguments: () => undefined as any
      });

      await withMocks(async ({ errorSpy }) => {
        await expect(execute(['--help'])).rejects.toBeDefined();
        expect(errorSpy.mock.calls).toStrictEqual([
          [expect.stringMatching(/typeof process\.argv/)]
        ]);
      });
    });

    it('calls all configuration hooks in the expected order', async () => {
      expect.hasAssertions();
    });

    it('does not call configureErrorHandlingEpilogue on GracefulEarlyExitError', async () => {
      expect.hasAssertions();
    });

    it('throws if configureArguments returns falsy', async () => {
      expect.hasAssertions();

      const { execute } = await bf.configureProgram({
        configureArguments: () => undefined as any
      });

      await withMocks(async ({ errorSpy }) => {
        await expect(execute(['--help'])).rejects.toMatchObject({
          message: expect.stringMatching(/typeof process\.argv/)
        });

        expect(errorSpy).toBeCalled();
      });
    });

    it('throws if configureExecutionEpilogue returns falsy', async () => {
      expect.hasAssertions();

      const { execute } = await bf.configureProgram({
        configureExecutionEpilogue: () => undefined as any
      });

      await withMocks(async ({ errorSpy }) => {
        await expect(execute(['--vex'])).rejects.toMatchObject({
          message: expect.stringMatching(/Arguments/)
        });

        expect(errorSpy).toBeCalled();
      });
    });
  });

  describe('<command module auto-discovery>', () => {
    it('supports function modules and object modules', async () => {
      expect.hasAssertions();

      await withMocks(async ({ logSpy }) => {
        const run = bf_util.makeRunner(getFixturePath('different-module-types'));

        await expect(run('exports-function --exports-function')).resolves.toStrictEqual(
          expect.objectContaining({
            exportsFunction: 1,
            handled_by: getFixturePath(['different-module-types', 'exports-function.js'])
          })
        );

        await expect(run('exports-object positional')).resolves.toStrictEqual(
          expect.objectContaining({
            testPositional: 'positional',
            handled_by: getFixturePath(['different-module-types', 'exports-object.js'])
          })
        );

        const result = await run('--help');

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

    it('supports random additions to the ExecutionContext', async () => {
      expect.hasAssertions();
    });

    it('supports commands with positional arguments', async () => {
      expect.hasAssertions();
    });

    it('ignores empty command configuration root directory', async () => {
      expect.hasAssertions();

      await withMocks(async ({ logSpy }) => {
        await bf.runProgram(getFixturePath('empty'), '--help');
        expect(logSpy).toBeCalledWith(expect.stringContaining('Options:'));
        expect(logSpy).not.toBeCalledWith(expect.stringContaining('Commands:'));
      });
    });

    it('delegates parsing and handling to deeply nested commands', async () => {
      expect.hasAssertions();

      await withMocks(async () => {
        const run = bf_util.makeRunner(getFixturePath('nested-depth'));

        await expect(run('good1 good2 good3 command --command')).resolves.toStrictEqual(
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

        await expect(run('good1 good2 good3 --good3')).resolves.toStrictEqual(
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

        await expect(run('good1 good2 --good2')).resolves.toStrictEqual(
          expect.objectContaining({
            good2: 1,
            handled_by: getFixturePath(['nested-depth', 'good1', 'good2', 'index.js'])
          })
        );

        await expect(run('good1 --good1')).resolves.toStrictEqual(
          expect.objectContaining({
            good1: 1,
            handled_by: getFixturePath(['nested-depth', 'good1', 'index.js'])
          })
        );

        await expect(run('--nested-depth')).resolves.toStrictEqual(
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

      await withMocks(async ({ logSpy }) => {
        const run = bf_util.makeRunner(getFixturePath('nested-depth'));

        await run('--help');
        await run('good1 --help');
        await run('good1 good2 --help');
        await run('good1 good2 good3 --help');
        await run('good1 good2 good3 command --help');

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

    it('supports --version only for root command unless manually configured', async () => {
      expect.hasAssertions();
      // TODO: exits gracefully
    });

    it('does not repeat help text when handling yargs errors in deeply nested commands', async () => {
      expect.hasAssertions();

      await withMocks(async ({ errorSpy }) => {
        const run = bf_util.makeRunner(getFixturePath('nested-depth'));
        await run('good1 good2 good3 command --yelp');

        expect(errorSpy.mock.calls).toStrictEqual([
          expect.arrayContaining([expect.stringContaining('--help')]),
          [],
          [expect.stringMatching('Unknown argument: yelp')]
        ]);
      });
    });

    it('supports command aliases (parent, child, and root)', async () => {
      expect.hasAssertions();
    });

    it('supports command aliases case-sensitively', async () => {
      expect.hasAssertions();
    });

    it('ensures parent commands and child commands of the same name do not interfere', async () => {
      expect.hasAssertions();
    });

    it('disables yargs::argv magic getter only on non-shadow instances', async () => {
      expect.hasAssertions();
    });

    it('alpha-sorts commands that appear in help text', async () => {
      expect.hasAssertions();
    });

    it('enables strictness constraints on all commands', async () => {
      expect.hasAssertions();
    });

    it('enables strictness constraints on childless parents and childless root', async () => {
      expect.hasAssertions();
    });

    it('allows for childless root with a handler and no parameters/arguments', async () => {
      expect.hasAssertions();
    });

    it('allows custom strictness settings on shadow instances (dynamic strictness)', async () => {
      expect.hasAssertions();
    });

    it('disables yargs::strict, yargs::strictOptions, yargs::strictCommands only on non-shadow instances', async () => {
      expect.hasAssertions();
    });

    it('accepts ::strict_force(false) calls', async () => {
      expect.hasAssertions();
    });

    it('supports both CJS and ESM configuration files', async () => {
      expect.hasAssertions();
      // TODO: also supports something like module.exports.default = undefined
    });

    it('supports both empty ("") and false Configuration::description values', async () => {
      expect.hasAssertions();
    });

    it('capitalizes descriptions and custom usage text', async () => {
      expect.hasAssertions();
    });

    it('supports dynamic arguments (arguments that depend on other arguments)', async () => {
      expect.hasAssertions();
    });

    it('ensures PreExecutionContext::program is PreExecutionContext.commands[0].program', async () => {
      expect.hasAssertions();
    });

    it('behaves properly when CliError or non-CliError is thrown from handler', async () => {
      expect.hasAssertions();
    });

    it('throws when existence invariant is violated', async () => {
      expect.hasAssertions();
    });

    it('throws when a configuration file unexpectedly fails to load', async () => {
      expect.hasAssertions();
    });

    it('throws when auto-discovered command configuration contains invalid "command" property', async () => {
      expect.hasAssertions();
    });
  });
});

describe('::runProgram and util::bf_util.makeRunner', () => {
  it('supports all call signatures', async () => {
    expect.hasAssertions();

    await withMocks(async ({ getExitCode }) => {
      await bf.runProgram();
      expect(getExitCode()).toBe(FrameworkExitCode.Ok);
    });

    const run = bf_util.makeRunner();
    const preExecutionContext = await bf.configureProgram();

    await withMocks(async ({ logSpy, getExitCode }) => {
      await run();

      expect(getExitCode()).toBe(FrameworkExitCode.Ok);

      await run('--help');
      expect(getExitCode()).toBe(FrameworkExitCode.Ok);

      const result1 = await run({
        configureExecutionEpilogue(argv) {
          return { ...argv, something: 'here' };
        }
      });

      expect(getExitCode()).toBe(FrameworkExitCode.Ok);
      expect(result1).toStrictEqual(expect.objectContaining({ something: 'here' }));

      await run(preExecutionContext);
      expect(getExitCode()).toBe(FrameworkExitCode.Ok);

      const result2 = await run(['--help'], {
        configureExecutionEpilogue(argv) {
          return { ...argv, something: 'better' };
        }
      });

      expect(getExitCode()).toBe(FrameworkExitCode.Ok);
      expect(result2).toStrictEqual(expect.objectContaining({ something: 'better' }));

      await run('--help', preExecutionContext);
      expect(getExitCode()).toBe(FrameworkExitCode.Ok);

      const result3 = await run(['--help'], {
        execute: () => {
          throw new bf.GracefulEarlyExitError();
        },
        program: {}
      } as unknown as bf.PreExecutionContext);

      expect(getExitCode()).toBe(FrameworkExitCode.Ok);
      expect(result3).toBeEmptyObject();
      expect(logSpy).toBeCalledTimes(3);
    });
  });

  it('exits with FrameworkExitCode.Ok upon success', async () => {
    expect.hasAssertions();

    await withMocks(async ({ getExitCode }) => {
      await bf.runProgram();
      expect(getExitCode()).toBe(FrameworkExitCode.Ok);
    });

    await withMocks(async ({ getExitCode }) => {
      await bf_util.makeRunner()();
      expect(getExitCode()).toBe(FrameworkExitCode.Ok);
    });
  });

  it('exits with FrameworkExitCode.NotImplemented when command provides no handler', async () => {
    expect.hasAssertions();

    await withMocks(async ({ errorSpy, getExitCode }) => {
      const run = bf_util.makeRunner(getFixturePath('not-implemented'));
      await run('cmd');

      expect(getExitCode()).toBe(FrameworkExitCode.NotImplemented);
      expect(errorSpy).toBeCalled();
    });
  });

  it('exits with FrameworkExitCode.Ok when given --help argument even when command provides no handler', async () => {
    expect.hasAssertions();

    await withMocks(async ({ logSpy, getExitCode }) => {
      const run = bf_util.makeRunner(getFixturePath('not-implemented'));
      await run('nested --help');

      expect(getExitCode()).toBe(FrameworkExitCode.Ok);
      expect(logSpy).toBeCalled();
    });
  });

  it('exits with FrameworkExitCode.AssertionFailed when sanity check fails', async () => {
    expect.hasAssertions();

    await withMocks(async ({ errorSpy, getExitCode }) => {
      const run = bf_util.makeRunner();
      await run({ configureArguments: () => undefined as any });

      expect(getExitCode()).toBe(FrameworkExitCode.AssertionFailed);
      expect(errorSpy).toBeCalled();
    });
  });

  it('exits with FrameworkExitCode.DefaultError upon string error type', async () => {
    expect.hasAssertions();

    await withMocks(async ({ errorSpy, getExitCode }) => {
      await bf.runProgram(undefined, {
        configureArguments() {
          throw 'problems!';
        }
      });

      expect(getExitCode()).toBe(FrameworkExitCode.DefaultError);
      expect(errorSpy).toBeCalled();
    });
  });

  it('exits with FrameworkExitCode.DefaultError upon non-CliError error type', async () => {
    expect.hasAssertions();

    await withMocks(async ({ errorSpy, getExitCode }) => {
      await bf.runProgram(undefined, {
        configureArguments() {
          throw new Error('problems!');
        }
      });

      expect(getExitCode()).toBe(FrameworkExitCode.DefaultError);
      expect(errorSpy).toBeCalled();
    });
  });

  it('exits with specified exit code upon CliError error type', async () => {
    expect.hasAssertions();

    await withMocks(async ({ errorSpy, getExitCode }) => {
      await bf.runProgram(undefined, {
        configureArguments() {
          throw new CliError('problems!', { suggestedExitCode: 5 });
        }
      });

      expect(getExitCode()).toBe(5);
      expect(errorSpy).toBeCalled();
    });
  });

  it('otherwise never throws', async () => {
    expect.hasAssertions();
  });
});

describe('::CliError', () => {
  it('handles wrapped errors', async () => {
    expect.hasAssertions();

    await withMocks(async ({ errorSpy, getExitCode }) => {
      await bf.runProgram(undefined, {
        configureArguments() {
          throw new CliError(new Error('problems!'));
        }
      });

      expect(getExitCode()).toBe(1);
      expect(errorSpy).toBeCalled();
    });
  });
});
