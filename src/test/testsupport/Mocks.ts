import { vi, type Mocked } from 'vitest';

export function mock<T extends object>(type: abstract new (...args: never) => T): Mocked<T> {
  const instance = Object.create(type.prototype as object) as object;

  for (const methodName of collectMethodNames(type.prototype as object)) {
    Object.defineProperty(instance, methodName, { value: vi.fn() });
  }
  return instance as Mocked<T>;
}

function collectMethodNames(prototype: object): Set<string> {
  const methodNames = new Set<string>();

  for (let current: object | null = prototype; current !== null && current !== Object.prototype;
    current = Object.getPrototypeOf(current) as object | null) {
    for (const name of Object.getOwnPropertyNames(current)) {
      methodNames.add(name);
    }
  }
  methodNames.delete('constructor');
  return methodNames;
}
