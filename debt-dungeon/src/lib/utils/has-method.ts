import { isObject } from './is-object';

export function hasMethod(value: unknown, name: string): boolean {
  return isObject(value) && name in value && typeof value[name] === 'function';
}
