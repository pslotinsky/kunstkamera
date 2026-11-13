import { assert, assertIsDefined } from '@/lib/utils/assert';

import type { Attachable } from './attachable';

type AttachedState = {
  kind: 'attached';
  root: Element;
  elements: ReadonlyMap<string, HTMLElement>;
};

type DetachedState = {
  kind: 'detached';
};

type AttachmentState = AttachedState | DetachedState;

export type BoundElements<TClasses> = {
  readonly [TName in keyof TClasses]: HTMLElement;
};

export class ControlDomBlock implements Attachable {
  private readonly id: string;
  private readonly elementClasses = new Set<string>();
  private state: AttachmentState = { kind: 'detached' };

  constructor(id: string) {
    this.id = id;
  }

  public get isAttached(): boolean {
    return this.state.kind === 'attached';
  }

  public addModifier(className: string): void {
    this.root.classList.add(className);
  }

  public removeModifier(className: string): void {
    this.root.classList.remove(className);
  }

  public toggleModifier(className: string, enabled: boolean): void {
    this.root.classList.toggle(className, enabled);
  }

  public setStyleProperty(property: string, value: string): void {
    const element = this.root;

    if (element instanceof HTMLElement) {
      element.style.setProperty(property, value);
    }
  }

  public bindElements<TClasses extends Record<string, string>>(
    classes: TClasses,
  ): BoundElements<TClasses> {
    const descriptors: PropertyDescriptorMap = {};

    for (const [name, className] of Object.entries(classes)) {
      this.elementClasses.add(className);
      descriptors[name] = {
        enumerable: true,
        get: () => {
          const element = this.attachedState.elements.get(className);
          assertIsDefined(
            element,
            `Expected bound element ${name} for control ${this.id}`,
          );
          return element;
        },
      };
    }

    return Object.defineProperties({}, descriptors) as BoundElements<TClasses>;
  }

  public attach(container: Element): Element {
    const root = this.findRoot(container);
    const elements = this.findBoundElements(root);

    this.state = {
      root,
      elements,
      kind: 'attached',
    };

    return root;
  }

  public detach(): void {
    this.state = { kind: 'detached' };
  }

  public get root(): Element {
    return this.attachedState.root;
  }

  private get attachedState(): AttachedState {
    const state = this.state;

    assert(
      state.kind === 'attached',
      `Expected control ${this.id} to be attached`,
    );

    return state;
  }

  private findRoot(container: Element): Element {
    const selector = `[data-control-id="${this.id}"]`;

    const root = container.matches(selector)
      ? container
      : container.querySelector(selector);

    assertIsDefined(root, `Expected a DOM element for control ${this.id}`);

    return root;
  }

  private findBoundElements(root: Element): ReadonlyMap<string, HTMLElement> {
    const elements = new Map<string, HTMLElement>();

    for (const className of this.elementClasses) {
      const element = root.querySelector<HTMLElement>(`.${className}`);
      assertIsDefined(element, `Expected .${className} for control ${this.id}`);
      elements.set(className, element);
    }

    return elements;
  }
}
