import { Manager } from '@listr2/manager';

import { withMockedEnv, withMockedOutput } from 'testverse/setup';
import { type ExtendedDebugger } from '../debug-extended';

import {
  TAB,
  createDebugLogger,
  createGenericLogger,
  createListrManager,
  createListrTaskLogger,
  disableLogging,
  enableLogging,
  getLoggersByType,
  resetInternalState,
  type GenericListrTask,
  type ExtendedLogger
} from '../rejoinder';

const namespace = 'namespace';
const logExpectationRegExp = /namespace.+logged/;
const complexLogExpectationRegExp = /namespace.+logged:.+{.+success:.+true.+}/;

beforeEach(() => {
  resetInternalState();
});

describe('::TAB', () => {
  it('exports TAB', async () => {
    expect.hasAssertions();
    expect(TAB).toBeString();
  });
});

describe('::createGenericLogger', () => {
  it('returns ExtendedLogger instance', async () => {
    expect.hasAssertions();

    await withMockedOutput(({ logSpy }) => {
      const log = createGenericLogger({ namespace });

      expect(log.enabled).toBeTrue();
      expect(log.log).toBeDefined();

      log('logged');

      expect(logSpy.mock.calls).toStrictEqual([
        expect.arrayContaining([expect.stringMatching(logExpectationRegExp)])
      ]);
    });
  });

  it('returns instance capable of handling complex input', async () => {
    expect.hasAssertions();

    await withMockedOutput(({ logSpy }) => {
      const log = createGenericLogger({ namespace });

      expect(log.enabled).toBeTrue();
      expect(log.log).toBeDefined();

      log('logged: %O', { success: true });

      expect(logSpy.mock.calls).toStrictEqual([
        expect.arrayContaining([expect.stringMatching(complexLogExpectationRegExp)])
      ]);
    });
  });
});

describe('::createListrTaskLogger', () => {
  it('returns ExtendedLogger instance', async () => {
    expect.hasAssertions();

    const task = { output: null } as unknown as GenericListrTask;
    const log = createListrTaskLogger({ namespace, task });

    expect(log.enabled).toBeTrue();
    expect(log.log).toBeDefined();

    log('logged');
    expect(task.output).toStrictEqual(expect.stringMatching(logExpectationRegExp));
  });

  it('returns instance capable of handling complex input', async () => {
    expect.hasAssertions();

    const task = { output: null } as unknown as GenericListrTask;
    const log = createListrTaskLogger({ namespace, task });

    expect(log.enabled).toBeTrue();
    expect(log.log).toBeDefined();

    log('logged: %O', { success: true });
    expect(task.output).toStrictEqual(expect.stringMatching(complexLogExpectationRegExp));
  });
});

describe('::createDebugLogger', () => {
  it('returns ExtendedDebugger instance', async () => {
    expect.hasAssertions();

    await withMockedOutput(({ stdErrSpy }) => {
      const debug = createDebugLogger({ namespace });

      debug.enabled = true;
      debug('logged');

      expect(stdErrSpy.mock.calls).toStrictEqual([
        expect.arrayContaining([expect.stringMatching(logExpectationRegExp)])
      ]);
    });
  });

  it('returns instance capable of handling complex input', async () => {
    expect.hasAssertions();

    await withMockedOutput(({ stdErrSpy }) => {
      const debug = createDebugLogger({ namespace });

      debug.enabled = true;
      debug('logged: %O', { success: true });

      expect(stdErrSpy.mock.calls).toStrictEqual([
        expect.arrayContaining([expect.stringMatching(complexLogExpectationRegExp)])
      ]);
    });
  });
});

describe('::createListrManager', () => {
  it('returns Listr2 Manager instance', async () => {
    expect.hasAssertions();
    expect(createListrManager()).toBeInstanceOf(Manager);
  });

  it('returns a Manager using default renderer by default', async () => {
    expect.hasAssertions();

    await withMockedEnv(() => {
      expect(createListrManager().options?.renderer).toBe('default');
    }, {});
  });

  it('returns a Manager using verbose renderer if process.env.DEBUG is present', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      () => {
        expect(createListrManager().options?.renderer).toBe('verbose');
      },
      { DEBUG: '*:*' }
    );
  });

  it('returns a Manager using verbose renderer if any debug loggers are enabled', async () => {
    expect.hasAssertions();

    createDebugLogger({ namespace }).enabled = true;
    expect(createListrManager().options?.renderer).toBe('verbose');
  });
});

describe('::disableLogging', () => {
  const loggers: {
    log: ExtendedLogger;
    listr: ExtendedLogger;
    debug: ExtendedDebugger;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = {} as any;

  beforeEach(() => {
    loggers.log = createGenericLogger({ namespace: 'generic' });
    loggers.log.log = jest.fn();

    loggers.listr = createListrTaskLogger({
      namespace: 'listr',
      task: { output: '' } as GenericListrTask
    });
    loggers.listr.log = jest.fn();

    loggers.debug = createDebugLogger({ namespace: 'debug' });
    loggers.debug.log = jest.fn();
  });

  it('disables all possible loggers if no filter specified', async () => {
    expect.hasAssertions();

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    disableLogging({ type: 'all' });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalse();
  });

  it('leaves disabled loggers disabled', async () => {
    expect.hasAssertions();

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    disableLogging({ type: 'all' });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalse();

    disableLogging({ type: 'all' });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalse();
  });

  it('disables loggers by namespace string exact match', async () => {
    expect.hasAssertions();

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    disableLogging({ type: 'all', filter: 'generic' });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    disableLogging({ type: 'all', filter: 'listr' });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalsy();

    disableLogging({ type: 'all', filter: 'debug' });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalse();

    loggers.debug.enabled = true;

    expect(loggers.debug.enabled).toBeTrue();

    disableLogging({ type: 'all', filter: 'debug' });

    expect(loggers.debug.enabled).toBeFalse();
  });

  it('disables loggers by namespace regex match', async () => {
    expect.hasAssertions();

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    disableLogging({ type: 'all', filter: /generic|debug/ });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalse();
  });

  it('does not reuse stateful RegExp instances', async () => {
    expect.hasAssertions();

    loggers.log.enabled = true;
    loggers.listr.enabled = true;
    loggers.debug.enabled = true;

    const parameters = { type: 'all', filter: /generic|debug/g } as const;

    disableLogging(parameters);

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalse();

    loggers.log.enabled = true;
    loggers.listr.enabled = true;
    loggers.debug.enabled = true;

    disableLogging(parameters);

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalse();
  });

  it('disables loggers by type match', async () => {
    expect.hasAssertions();

    loggers.debug.enabled = true;

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();

    disableLogging({ type: 'stdout' });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeTrue();

    loggers.log.enabled = true;
    loggers.listr.enabled = true;

    disableLogging({ type: 'debug' });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalse();
  });

  it('does not disable loggers with unsound combinations of matchers', async () => {
    expect.hasAssertions();

    loggers.debug.enabled = true;

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();

    disableLogging({ type: 'all', filter: 'no-match' });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();

    disableLogging({ type: 'debug', filter: /log|listr/ });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();

    disableLogging({ type: 'stdout', filter: /debug/ });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();
  });
});

describe('::enableLogging', () => {
  const loggers: {
    log: ExtendedLogger;
    listr: ExtendedLogger;
    debug: ExtendedDebugger;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = {} as any;

  beforeEach(() => {
    loggers.log = createGenericLogger({ namespace: 'generic' });
    loggers.log.log = jest.fn();

    loggers.listr = createListrTaskLogger({
      namespace: 'listr',
      task: { output: '' } as GenericListrTask
    });
    loggers.listr.log = jest.fn();

    loggers.debug = createDebugLogger({ namespace: 'debug' });
    loggers.debug.log = jest.fn();
  });

  it('enables all possible loggers if no filter specified', async () => {
    expect.hasAssertions();

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'all' });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();
  });

  it('leaves enabled loggers enabled', async () => {
    expect.hasAssertions();

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'all' });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();

    enableLogging({ type: 'all' });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();
  });

  it('enables loggers by namespace string exact match', async () => {
    expect.hasAssertions();

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'all', filter: 'generic' });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'all', filter: 'listr' });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'all', filter: 'debug' });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();

    loggers.log.enabled = false;

    expect(loggers.log.enabled).toBeFalse();

    enableLogging({ type: 'all', filter: 'generic' });

    expect(loggers.log.enabled).toBeTrue();
  });

  it('enables loggers by namespace regex match', async () => {
    expect.hasAssertions();

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'all', filter: /generic|debug/ });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeTrue();
  });

  it('does not reuse stateful RegExp instances', async () => {
    expect.hasAssertions();

    loggers.log.enabled = false;
    loggers.listr.enabled = false;
    loggers.debug.enabled = false;

    const parameters = { type: 'all', filter: /generic|debug/g } as const;

    enableLogging(parameters);

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeTrue();

    loggers.log.enabled = false;
    loggers.listr.enabled = false;
    loggers.debug.enabled = false;

    enableLogging(parameters);

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeTrue();
  });

  it('enables loggers by type match', async () => {
    expect.hasAssertions();

    loggers.log.enabled = false;
    loggers.listr.enabled = false;

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'stdout' });

    expect(loggers.log.enabled).toBeTrue();
    expect(loggers.listr.enabled).toBeTrue();
    expect(loggers.debug.enabled).toBeFalsy();

    loggers.log.enabled = false;
    loggers.listr.enabled = false;

    enableLogging({ type: 'debug' });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeTrue();
  });

  it('does not enable loggers with unsound combinations of matchers', async () => {
    expect.hasAssertions();

    loggers.log.enabled = false;
    loggers.listr.enabled = false;

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'all', filter: 'no-match' });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'debug', filter: /log|listr/ });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalsy();

    enableLogging({ type: 'stdout', filter: /debug/ });

    expect(loggers.log.enabled).toBeFalse();
    expect(loggers.listr.enabled).toBeFalse();
    expect(loggers.debug.enabled).toBeFalsy();
  });
});

describe('::getLoggersByType', () => {
  it('returns subset of loggers by type', async () => {
    expect.hasAssertions();

    const debug1 = createDebugLogger({ namespace: 'debug' });
    const log1 = createGenericLogger({ namespace: 'generic' });
    const listr1 = createListrTaskLogger({
      namespace: 'listr',
      task: { output: '' } as GenericListrTask
    });

    const debug2 = createDebugLogger({ namespace: 'debug' });
    const log2 = createGenericLogger({ namespace: 'generic' });
    const listr2 = createListrTaskLogger({
      namespace: 'listr',
      task: { output: '' } as GenericListrTask
    });

    expect(getLoggersByType({ type: 'all' })).toIncludeAllMembers([
      debug1,
      log1,
      listr1,
      debug2,
      log2,
      listr2
    ]);

    expect(getLoggersByType({ type: 'debug' })).toIncludeAllMembers([debug1, debug2]);

    expect(getLoggersByType({ type: 'stdout' })).toIncludeAllMembers([
      log1,
      listr1,
      log2,
      listr2
    ]);
  });
});
