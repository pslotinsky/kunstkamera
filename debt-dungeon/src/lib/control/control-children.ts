import { hasMethod } from '@/lib/utils/has-method';
import { isArray } from '@/lib/utils/is-array';
import { isObject } from '@/lib/utils/is-object';

import type { Attachable } from './attachable';

export class ControlChildren<
  TTree extends Record<string, unknown> = Record<string, unknown>,
> {
  public readonly tree: TTree;

  constructor(tree: TTree) {
    this.tree = tree;
  }

  public attach(container: Element): void {
    for (const child of this.traverse()) {
      child.attach(container);
    }
  }

  public detach(): void {
    for (const child of this.traverse()) {
      child.detach();
    }
  }

  private *traverse(): Generator<Attachable> {
    yield* this.traverseValue(this.tree);
  }

  private *traverseValue(value: unknown): Generator<Attachable> {
    if (this.isAttachable(value)) {
      yield value;
    } else if (isArray(value)) {
      for (const child of value) {
        yield* this.traverseValue(child);
      }
    } else if (isObject(value)) {
      for (const child of Object.values(value)) {
        yield* this.traverseValue(child);
      }
    }
  }

  private isAttachable(value: unknown): value is Attachable {
    return hasMethod(value, 'attach') && hasMethod(value, 'detach');
  }
}
