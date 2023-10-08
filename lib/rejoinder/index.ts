/* eslint-disable no-console */
/* eslint-disable unicorn/prefer-regexp-test */
// TODO: replace this with the actual rejoinder and vice-versa!

import {
  $instances,
  debugFactory,
  type ExtendedDebugger,
  type UnextendableInternalDebugger
} from '../debug-extended';

import {
  PRESET_TIMER,
  type ListrTaskWrapper,
  type ListrContext,
  type ListrRenderer,
  type ListrBaseClassOptions
} from 'listr2';

import { Manager } from '@listr2/manager';

/**
 * A thin wrapper around {@link ExtendedDebugger } representing the extension
 * from mere "debug" logger to general purpose "logger".
 */
export interface ExtendedLogger extends ExtendedDebugger {}

/**
 * Represents a generic Listr2 Task object.
 * @internal
 */
export type GenericListrTask = ListrTaskWrapper<
  ListrContext,
  typeof ListrRenderer,
  typeof ListrRenderer
>;

/**
 * Keeps track of our various "logger" (i.e. debug) instances and their
 * associated metadata.
 */
const metadata = {
  stdout: [] as ExtendedLogger[],
  debug: [] as ExtendedDebugger[]
};

/**
 * A string of spaces representing a CLI "tab".
 */
export const TAB = '    ';

/**
 * Create and return new set of logger instances.
 */
export function createGenericLogger({
  namespace
}: {
  /**
   * The namespace of the logger. The namespace must be a valid [`debug`
   * namespace](https://npm.im/debug#namespace-colors).
   *
   * @see https://npm.im/debug#namespace-colors
   */
  namespace: string;
}) {
  const logger = makeExtendedLogger(debugFactory(namespace), {
    log: console.log.bind(console)
  });

  metadata.stdout.push(logger);
  return logger;
}

/**
 * Create and return a new set of logger instances configured to output via a
 * Listr2 task.
 */
export function createListrTaskLogger({
  namespace,
  task
}: {
  /**
   * The namespace of the logger. The namespace must be a valid [`debug`
   * namespace](https://npm.im/debug#namespace-colors).
   *
   * @see https://npm.im/debug#namespace-colors
   */
  namespace: string;
  /**
   * The task to which logging output will be sent.
   */
  task: GenericListrTask;
}) {
  const logger = makeExtendedLogger(createGenericLogger({ namespace }), {
    log: (...args) => {
      task.output = args.join(' ');
    }
  });

  return logger;
}

/**
 * Create a new debug logger instance.
 */
export function createDebugLogger({
  namespace
}: {
  /**
   * The namespace of the logger. The namespace must be a valid [`debug`
   * namespace](https://npm.im/debug#namespace-colors).
   *
   * @see https://npm.im/debug#namespace-colors
   */
  namespace: string;
}) {
  const debug = debugFactory(namespace);
  metadata.debug.push(debug);
  return debug;
}

/**
 * Create and return a new Listr2 {@link Manager} instance pre-configured to
 * work in harmony with rejoinder.
 *
 * Specifically, this instance:
 *
 *   - Has good consistent defaults.
 *
 *   - Switches to the verbose renderer when the DEBUG environment variable is
 *     present or any of the debug logger namespaces are enabled.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createListrManager<T = any>(options?: {
  /**
   * Properties provided here will override the defaults passed to the
   * {@link Manager} constructor.
   */
  overrides?: ListrBaseClassOptions;
}) {
  const manager = new Manager<T, 'default' | 'verbose'>({
    concurrent: false,
    exitOnError: true,
    renderer:
      !!process.env.DEBUG || metadata.debug.some((l) => l.enabled)
        ? 'verbose'
        : 'default',
    rendererOptions: {
      collapseSubtasks: false,
      collapseSkips: false,
      timer: PRESET_TIMER
    },
    ...options?.overrides
  });

  return manager;
}

/**
 * Return an array of all known loggers of a specific type: either `stdout`,
 * `debug`, or both (`all`).
 */
export function getLoggersByType({
  type = 'stdout'
}: {
  /**
   * The type of loggers to return. Defaults to `"stdout"`, meaning loggers
   * created via `createDebugLogger` will not be returned by default.
   *
   * @default "stdout"
   */
  type: 'all' | 'stdout' | 'debug';
}) {
  const instances = [];

  if (type === 'all' || type === 'stdout') {
    instances.push(...metadata.stdout);
  }

  if (type === 'all' || type === 'debug') {
    instances.push(...metadata.debug);
  }

  return instances;
}

/**
 * Disable all logger instances.
 */
export function disableLogging({
  type = 'stdout',
  filter
}: {
  /**
   * The type of logging to disable. Defaults to `"stdout"`, meaning loggers
   * created via `createDebugLogger` are unaffected by default.
   *
   * @default "stdout"
   */
  type: 'all' | 'stdout' | 'debug';

  /**
   * Optionally filter the loggers to be disabled. If `filter` is a string, only
   * loggers with namespaces equal to `filter` will be disabled. If `filter` is
   * a regular expression, only loggers with namespaces matching the expression
   * will be disabled.
   */
  filter?: string | RegExp;
}) {
  const instances = getLoggersByType({ type }).flatMap((l) =>
    Object.values(l[$instances])
  );

  for (const instance of instances) {
    if (
      !filter ||
      (typeof filter === 'string' && instance.namespace === filter) ||
      !!instance.namespace.match(filter)
    ) {
      instance.enabled = false;
    }
  }
}

/**
 * Enable all logger instances.
 */
export function enableLogging({
  type = 'stdout',
  filter
}: {
  /**
   * The type of logging to enable. Defaults to `"stdout"`, meaning loggers
   * created via `createDebugLogger` are unaffected by default.
   *
   * @default "stdout"
   */
  type: 'all' | 'stdout' | 'debug';

  /**
   * Optionally filter the loggers to be enabled. If `filter` is a string, only
   * loggers with namespaces equal to `filter` will be enabled. If `filter` is a
   * regular expression, only loggers with namespaces matching the expression
   * will be enabled.
   */
  filter?: string | RegExp;
}) {
  const instances = getLoggersByType({ type }).flatMap((l) =>
    Object.values(l[$instances])
  );

  for (const instance of instances) {
    if (
      !filter ||
      (typeof filter === 'string' && instance.namespace === filter) ||
      !!instance.namespace.match(filter)
    ) {
      instance.enabled = true;
    }
  }
}

/**
 * A function that resets the internal logger cache. Essentially, calling this
 * function causes rejoinder to forget any loggers created prior.
 */
export function resetInternalState() {
  metadata.debug.length = 0;
  metadata.stdout.length = 0;
}

/**
 * Transforms an {@link ExtendedDebugger} into an {@link ExtendedLogger}.
 */
function makeExtendedLogger(
  logger: ExtendedDebugger,
  overrides?: Partial<UnextendableInternalDebugger>
): ExtendedLogger {
  const extend = logger.extend.bind(logger);
  logger.extend = (...args) => makeExtendedLogger(extend(...args), overrides);

  for (const instance of Object.values(logger[$instances])) {
    instance.enabled = true;
    Object.assign(instance, overrides);
  }

  return logger;
}
