/* eslint-disable no-console */
import getDebugger, { type Debug as Debug_, type Debugger as Debugger_ } from 'debug';

type _InternalDebuggerNoExtends = Omit<InternalDebugger, 'extend'>;

/**
 * Represents a property on a "root" Debug instance that returns an array of its
 * sub-instances (e.g. "error", "warn", etc). The array will also include the
 * root Debug instance.
 */
export const $instances = Symbol('debug-extended-builtin-sub-instances');

/**
 * The base `Debug` interface coming from the [debug](https://npmi.im/debug)
 * package.
 */
export interface InternalDebug extends Debug_ {
  (...args: Parameters<Debug_>): ReturnType<Debug_>;
}

/**
 * The base `Debugger` interface coming from the [debug](https://npmi.im/debug)
 * package.
 */
export interface InternalDebugger extends Debugger__ {
  (...args: Parameters<Debugger_>): ReturnType<Debugger_>;
}
type Debugger__ = Omit<Debugger_, 'log'> & { log?: Debugger_['log'] };

/**
 * An instance of {@link InternalDebugger} that cannot be extended via
 * {@link InternalDebugger.extend}.
 */
export interface UnextendableInternalDebugger extends InternalDebugger {
  (...args: Parameters<InternalDebugger>): ReturnType<InternalDebugger>;
}

/**
 * A Debug factory interface that returns {@link ExtendedDebugger} instances.
 */
export interface ExtendedDebug extends InternalDebug {
  (...args: Parameters<InternalDebug>): ExtendedDebugger;
}

/**
 * A Debugger interface extended with convenience methods.
 */
export interface ExtendedDebugger extends _InternalDebuggerNoExtends, DebuggerExtension {
  (...args: Parameters<InternalDebugger>): ReturnType<InternalDebugger>;
  [$instances]: DebuggerExtension & {
    /**
     * A cyclical reference to the current logger.
     */
    log: ExtendedDebugger;
  };
  /**
   * Creates a new instance by appending `namespace` to the current logger's
   * namespace.
   */
  extend: (...args: Parameters<InternalDebugger['extend']>) => ExtendedDebugger;
  /**
   * Send a blank newline to output.
   */
  newline: () => void;
}

/**
 * The shape of the new keys that are added to the {@link InternalDebugger} object.
 * {@link InternalDebugger} + {@link DebuggerExtension} = {@link ExtendedDebugger}.
 */
export type DebuggerExtension = {
  /**
   * A sub-instance for outputting messages to the attention of the reader.
   */
  message: UnextendableInternalDebugger;
  /**
   * A sub-instance for outputting error messages.
   */
  error: UnextendableInternalDebugger;
  /**
   * A sub-instance for outputting warning messages.
   */
  warn: UnextendableInternalDebugger;
};

/**
 * An `ExtendedDebug` instance that returns an {@link ExtendedDebugger} instance
 * via {@link extendDebugger}.
 */
const debugFactory = ((...args: Parameters<InternalDebug>) => {
  return extendDebugger(getDebugger(...args));
}) as ExtendedDebug;

Object.assign(debugFactory, getDebugger);

export { debugFactory };

/**
 * Extends a {@link InternalDebugger} instance with several convenience methods,
 * returning an {@link ExtendedDebugger} instance.
 */
export function extendDebugger(instance: InternalDebugger) {
  const extend = instance.extend.bind(instance);
  const finalInstance = instance as unknown as ExtendedDebugger;

  finalInstance.message = finalizeDebugger(extend('<message>'));
  finalInstance.error = finalizeDebugger(extend('<error>'));
  finalInstance.warn = finalizeDebugger(extend('<warn>'));
  finalInstance.extend = (...args) => extendDebugger(extend(...args));

  finalInstance.newline = () => {
    if (finalInstance.enabled) {
      if (finalInstance.log) {
        finalInstance.log('');
      } else {
        debugFactory.log('');
      }
    }
  };

  finalInstance[$instances] = {
    log: finalInstance,
    message: finalInstance.message,
    error: finalInstance.error,
    warn: finalInstance.warn
  };

  return finalInstance;
}

/**
 * Replace the `extend` method of an {@link InternalDebugger} instance with a
 * function that always throws.
 */
export function finalizeDebugger(
  instance: InternalDebugger
): UnextendableInternalDebugger {
  instance.extend = () => {
    throw new Error('instance is not extendable');
  };

  return instance;
}
