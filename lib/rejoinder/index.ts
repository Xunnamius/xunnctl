/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/prefer-regexp-test */
// TODO: replace this with the actual rejoinder and vice-versa!

// ! SPLIT OFF LISTR2 FEATURES AS SEPARATE PACKAGE

import assert from 'node:assert';
import { isPromise } from 'node:util/types';

import {
  ListrLogger,
  PRESET_TIMER,
  PRESET_TIMESTAMP,
  ProcessOutput,
  type ListrBaseClassOptions,
  type ListrContext,
  type ListrRenderer,
  type ListrTaskWrapper
} from 'listr2';

import { Manager } from '@listr2/manager';

import {
  $instances,
  debugFactory,
  type DebuggerExtension,
  type ExtendedDebugger,
  type InternalDebugger,
  type UnextendableInternalDebugger
} from 'multiverse/debug-extended';

import { ansiRedColorCodes } from 'universe/constant';

import type { Entry } from 'type-fest';

export { debugFactory as extendedDebugFactory, type ExtendedDebugger };

/**
 * A pre-customized Listr {@link Manager} instance.
 */
export type ListrManager<T = any> = Manager<T, 'default' | 'verbose'>;

/**
 * @internal
 */
export type WithExtendedParameters<
  T extends (...args: any[]) => any,
  Optional = true
> = Optional extends true
  ? [tags?: string[], ...Parameters<T>]
  : [tags: string[], ...Parameters<T>];

/**
 * @internal
 */
export type WithTagSupport<T extends (...args: any[]) => any, Optional = true> = ((
  ...args: WithExtendedParameters<T, Optional>
) => ReturnType<T> | undefined) & {
  [P in keyof T]: T[P];
};

/**
 * @internal
 */
export type ExtendedLoggerParameters = WithExtendedParameters<ExtendedDebugger, false>;

/**
 * A wrapper around {@link ExtendedDebugger } representing the extension from
 * mere "debug" logger to general purpose "logger".
 */
export interface ExtendedLogger extends _ExtendedLogger<ExtendedLogger> {
  /**
   * Send an optionally-formatted message to output.
   */
  (...args: Parameters<ExtendedDebugger>): ReturnType<ExtendedDebugger>;
  /**
   * Send a tagged optionally-formatted message to output.
   */
  (...args: ExtendedLoggerParameters): ReturnType<ExtendedDebugger>;
  /**
   * Send a blank newline to output.
   *
   * @param outputMethod Determines if the newline will be output via the
   * default output method or the alternate output method. This parameter only
   * has an effect when using certain logger backends and typically corresponds
   * to stdout (`"default"`) and stderr (`"alternate"`).
   */
  newline(
    ...args: [
      ...WithExtendedParameters<ExtendedDebugger['newline'], false>,
      outputMethod?: 'default' | 'alternate'
    ]
  ): ReturnType<ExtendedDebugger['newline']>;
  /**
   * Send a blank newline to output.
   *
   * @param outputMethod Determines if the newline will be output via the
   * default output method or the alternate output method. This parameter only
   * has an effect when using certain logger backends and typically corresponds
   * to stdout (`"default"`) and stderr (`"alternate"`).
   */
  newline(
    ...args: [outputMethod?: 'default' | 'alternate']
  ): ReturnType<ExtendedDebugger['newline']>;
  /**
   * Creates a new instance by appending `namespace` to the current logger's
   * namespace.
   */
  extend(...args: Parameters<ExtendedDebugger['extend']>): ExtendedLogger;
}
type _ExtendedLogger<T> = Omit<
  ExtendedDebugger,
  keyof DebuggerExtension | 'newline' | 'extend'
> &
  DebuggerExtension<WithTagSupport<UnextendableInternalDebugger>, T>;

/**
 * Represents a generic Listr2 Task object.
 *
 * @internal
 */
export type GenericListrTask = ListrTaskWrapper<
  ListrContext,
  typeof ListrRenderer,
  typeof ListrRenderer
>;

/**
 * Keeps track of our various "logger" (i.e. debug) instances and their
 * associated metadata. Also keeps track of those tags for which we disable
 * output.
 */
const metadata = {
  stdout: [] as ExtendedLogger[],
  debug: [] as ExtendedDebugger[],
  blacklist: new Set<string>()
};

/**
 * A string of spaces representing a CLI "tab".
 */
export const TAB = '    ';

// eslint-disable-next-line no-console
const consoleLog = (...args: unknown[]) => console.log(...args);
// eslint-disable-next-line no-console
const consoleError = (...args: unknown[]) => console.error(...args);

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
  const logger = makeExtendedLogger(debugFactory(namespace), consoleLog, consoleError);

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
  const logger = makeExtendedLogger(
    debugFactory(namespace),
    function (...args: unknown[]) {
      task.output = args.join(' ');
    }
  );

  metadata.stdout.push(logger);
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
  debug.log = consoleError;
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
export function createListrManager<T = any>(options?: {
  /**
   * Properties provided here will override the defaults passed to the
   * {@link Manager} constructor.
   */
  overrides?: ListrBaseClassOptions;
}) {
  const processOutput = new ProcessOutput();
  // ? Since we use the fallback logger whenever we're in debug mode, let's
  // ? allow debug traffic to hit stderr live.
  processOutput.hijack = processOutput.release = () => undefined /* noop */;

  const manager = new Manager<T, 'default', 'verbose' | 'simple'>({
    concurrent: false,
    collectErrors: 'minimal',
    exitOnError: true,
    registerSignalListeners: true,
    renderer: 'default',
    fallbackRenderer: 'verbose',
    fallbackRendererCondition: () =>
      !!process.env.DEBUG || metadata.debug.some((l) => l.enabled),
    rendererOptions: {
      collapseSubtasks: false,
      collapseSkips: false,
      timer: PRESET_TIMER
    },
    fallbackRendererOptions: {
      timestamp: PRESET_TIMESTAMP,
      timer: PRESET_TIMER,
      logger: new ListrLogger({ processOutput })
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
  type
}: {
  /**
   * The type of loggers to return. Valid values are one of:
   *
   * - `stdout` returns loggers created via `createGenericLogger`
   *
   * - `debug` returns loggers created via `createDebugLogger`
   *
   * - `all` returns all loggers
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
 * Disable all logger instances (coarse-grain).
 */
export function disableLoggers({
  type,
  filter
}: {
  /**
   * The type of logging to disable. Valid values are one of:
   *
   * - `stdout` disables loggers created via `createGenericLogger`
   *
   * - `debug` disables loggers created via `createDebugLogger`
   *
   * - `all` disables all loggers
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
 * Enable all logger instances (coarse-grain).
 */
export function enableLoggers({
  type,
  filter
}: {
  /**
   * The type of logging to enable. Valid values are one of:
   *
   * - `stdout` enables loggers created via `createGenericLogger`
   *
   * - `debug` enables loggers created via `createDebugLogger`
   *
   * - `all` enables all loggers
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
 * Prevents logs with the specified tags from being sent to output.
 */
export function disableLoggingByTag({
  tags
}: {
  /**
   * The tags of messages that will no longer be sent to output. If `tags` is
   * empty`, calling this function is effectively a noop.
   */
  tags: string[];
}) {
  tags.forEach((tag) => metadata.blacklist.add(tag));
}

/**
 * Allows logs with the specified tags to resume being sent to output. Only relevant as the inverse function of {@link disableLoggingByTag}.
 */
export function enableLoggingByTag({
  tags
}: {
  /**
   * The tags of messages that will resume being sent to output. If `tags` is
   * empty`, calling this function is effectively a noop.
   */
  tags: string[];
}) {
  tags.forEach((tag) => metadata.blacklist.delete(tag));
}

/**
 * A function that resets the internal logger cache. Essentially, calling this
 * function causes rejoinder to forget any disabled tags or loggers created
 * prior.
 */
export function resetInternalState() {
  metadata.debug.length = 0;
  metadata.stdout.length = 0;
  metadata.blacklist.clear();
}

/**
 * Transforms an {@link ExtendedDebugger} into an {@link ExtendedLogger}.
 */
function makeExtendedLogger(
  extendedDebugger: ExtendedDebugger,
  /**
   * This function will be called with various arguments of unknown type when
   * default (e.g. stdout) output should be sent to the user, such as when
   * `::newline(...)` is called.
   */
  underlyingDefaultLogFn: NonNullable<InternalDebugger['log']>,
  /**
   * This function will be called with various arguments of unknown type when
   * alternate (e.g. stderr) output should be sent to the user, such as when
   * `::newline(..., 'alternate')` and `::error(...)`, `::warn(...)`,
   * `::message(...)`, etc are called.
   */
  underlyingAlternateLogFn: NonNullable<InternalDebugger['log']> = underlyingDefaultLogFn
): ExtendedLogger {
  const baseLoggerFn = decorateWithTagSupport(extendedDebugger, 2);
  const baseNewlineFn = decorateWithTagSupport(
    (outputMethod: Parameters<ExtendedLogger['newline']>[0]) => {
      if (extendedLogger.enabled) {
        (outputMethod === 'alternate'
          ? underlyingAlternateLogFn
          : underlyingDefaultLogFn)('');
      }
    },
    1
  ) as typeof extendedLogger.newline;

  const extendedLogger = new Proxy(extendedDebugger as ExtendedLogger, {
    apply(
      _target,
      _this: unknown,
      args: Parameters<WithTagSupport<typeof extendedDebugger>>
    ) {
      return baseLoggerFn(...args);
    },
    get(target, property: PropertyKey, proxy: ExtendedLogger) {
      if (property === 'extend') {
        return function (...args: Parameters<ExtendedLogger['extend']>) {
          return makeExtendedLogger(
            extendedDebugger.extend(...args),
            underlyingDefaultLogFn,
            underlyingAlternateLogFn
          );
        };
      }

      if (property === 'newline') {
        return function (...args: Parameters<ExtendedLogger['newline']>) {
          return baseNewlineFn(...args);
        };
      }

      const value: unknown = target[property as keyof typeof target];

      if (typeof value === 'function') {
        return function (...args: unknown[]) {
          // ? This is "this-recovering" code.
          const returnValue = value.apply(target, args);
          // ? Whenever we'd return a yargs instance, return the wrapper
          // ? program instead.
          /* istanbul ignore next */
          return isPromise(returnValue)
            ? returnValue.then((realReturnValue) => maybeReturnProxy(realReturnValue))
            : maybeReturnProxy(returnValue);
        };
      }

      return value;

      /* istanbul ignore next */
      function maybeReturnProxy(returnValue: unknown) {
        return returnValue === target ? proxy : returnValue;
      }
    }
  });

  // ? Decorate the pre-extended instances (error, warn, etc) with tag support.
  for (const [key, instance] of Object.entries(extendedDebugger[$instances]).filter(
    (o): o is LoggerExtensionEntry => o[0] !== '$log'
  )) {
    if (key === 'error') {
      // ? Ensure "error" outputs are always red (color = 1 === red).
      // @ts-expect-error: external types are incongruent
      instance.color = 1;
    } else {
      ensureInstanceHasNonRedColor(instance);
    }

    // ? Ensure our sub-loggers are using the correct underlying logging
    // ? function.
    instance.log = underlyingAlternateLogFn;

    // ? Ensure our sub-loggers are enabled (generate output) by default.
    instance.enabled = true;

    // ? Decorate the sub-logger with tag support.
    extendedLogger[$instances][key] = decorateWithTagSupport(instance, 2);
  }

  // ? Ensure the special $log circular reference points back to us instead of
  // ? the original debug logger.
  extendedLogger[$instances].$log = extendedLogger;

  // ? Ensure our extendedLogger is using the correct underlying logging
  // ? function.
  extendedLogger.log = underlyingDefaultLogFn;

  // ? Ensure our extendedLogger is enabled (generates output) by default.
  extendedLogger.enabled = true;

  ensureInstanceHasNonRedColor(extendedLogger);

  return extendedLogger;

  type LoggerExtensionEntry = Entry<
    Omit<(typeof extendedDebugger)[typeof $instances], '$log'>
  >;

  function ensureInstanceHasNonRedColor(
    instance: ExtendedLogger | UnextendableInternalDebugger
  ) {
    if (ansiRedColorCodes.includes(instance.color as unknown as number)) {
      // ? Ensure only "error" outputs can be red

      const hiddenInternals = debugFactory as typeof debugFactory & { colors: number[] };
      assert(Array.isArray(hiddenInternals.colors));

      const oldAvailableColors = hiddenInternals.colors;
      hiddenInternals.colors = oldAvailableColors.filter(
        (c) => !ansiRedColorCodes.includes(c)
      );

      try {
        const selectedColor = hiddenInternals.selectColor(extendedDebugger.namespace);
        assert(typeof selectedColor === 'number' || typeof selectedColor === 'string');

        // @ts-expect-error: external types are incongruent
        instance.color = selectedColor;
      } finally {
        hiddenInternals.colors = oldAvailableColors;
      }
    }
  }
}

/**
 * Allows logging to be disabled via tags at the fine-grain message level. Set
 * `trapdoorArgLength` to the number of params necessary to trigger
 * blacklisting.
 */
function decorateWithTagSupport<T extends (...args: any[]) => any>(
  fn: T,
  trapdoorArgsMinLength: number
): WithTagSupport<T> {
  return new Proxy(fn as WithTagSupport<T>, {
    apply(_target, _this: unknown, args: Parameters<typeof fn>) {
      if (args.length >= trapdoorArgsMinLength && Array.isArray(args[0])) {
        if (args[0].some((tag) => metadata.blacklist.has(tag))) {
          return undefined;
        }

        return fn(...args.slice(1));
      }

      return fn(...args);
    }
  });
}
