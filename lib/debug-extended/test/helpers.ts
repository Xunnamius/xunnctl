import { type ExtendedDebugger } from '../index';

export function expectExtendedDebugger(
  instance: unknown,
  options: { returnType: 'boolean' }
): boolean;
export function expectExtendedDebugger(
  instance: unknown,
  options?: { returnType: 'void' }
): void;
export function expectExtendedDebugger(
  instance: unknown,
  options?: { returnType: 'boolean' | 'void' }
): boolean | void {
  const { returnType = 'void' } = options || {};
  const dbg = instance as ExtendedDebugger;

  if (returnType === 'boolean') {
    return (
      !!instance &&
      expectUnextendableDebugger(dbg.message, { returnType: 'boolean' }) &&
      expectUnextendableDebugger(dbg.error, { returnType: 'boolean' }) &&
      expectUnextendableDebugger(dbg.warn, { returnType: 'boolean' }) &&
      typeof instance === 'function' &&
      'extend' in instance &&
      'newline' in instance
    );
  } else {
    expectUnextendableDebugger(dbg.message);
    expectUnextendableDebugger(dbg.error);
    expectUnextendableDebugger(dbg.warn);

    expect(instance).toHaveProperty('extend');
    expect(instance).toHaveProperty('newline');
  }
}

export function expectUnextendableDebugger(
  instance: unknown,
  options: { returnType: 'boolean' }
): boolean;
export function expectUnextendableDebugger(
  instance: unknown,
  options?: { returnType: 'void' }
): void;
export function expectUnextendableDebugger(
  instance: unknown,
  options?: { returnType: 'boolean' | 'void' }
): boolean | void {
  const { returnType = 'void' } = options || {};

  if (returnType === 'boolean') {
    if (
      !!instance &&
      typeof instance === 'function' &&
      !(
        'message' in instance ||
        'error' in instance ||
        'warn' in instance ||
        'newline' in instance
      )
    ) {
      try {
        (instance as ExtendedDebugger).extend('dummy');
        return false;
      } catch (error) {
        return /instance is not extendable/.test(`${error}`);
      }
    }
    return false;
  } else {
    expect(instance).not.toHaveProperty('message');
    expect(instance).not.toHaveProperty('error');
    expect(instance).not.toHaveProperty('warn');
    expect(instance).toHaveProperty('extend');
    expect(instance).not.toHaveProperty('newline');

    expect(() => (instance as ExtendedDebugger).extend('dummy')).toThrow(
      /instance is not extendable/
    );
  }
}
