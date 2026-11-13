import { assertIsDefined } from '@/lib/utils/assert';

import type { Attachable } from './attachable';
import { ControlDomAnimator } from './control-dom-animator';
import { type BoundElements, ControlDomBlock } from './control-dom-block';

export class ControlDom implements Attachable {
  private readonly block: ControlDomBlock;
  private animator?: ControlDomAnimator;
  private abortController?: AbortController;

  constructor(id: string) {
    this.block = new ControlDomBlock(id);
  }

  public get isAttached(): boolean {
    return this.block.isAttached;
  }

  public get root(): Element {
    return this.block.root;
  }

  public addModifier(className: string): void {
    this.block.addModifier(className);
  }

  public removeModifier(className: string): void {
    this.block.removeModifier(className);
  }

  public toggleModifier(className: string, enabled: boolean): void {
    this.block.toggleModifier(className, enabled);
  }

  public setStyleProperty(property: string, value: string): void {
    this.block.setStyleProperty(property, value);
  }

  public bindElements<TClasses extends Record<string, string>>(
    classes: TClasses,
  ): BoundElements<TClasses> {
    return this.block.bindElements(classes);
  }

  public attach(container: Element): Element {
    const root = this.block.attach(container);

    this.abortController = new AbortController();
    this.animator = new ControlDomAnimator(
      this.block,
      this.abortController.signal,
    );

    return root;
  }

  public detach(): void {
    if (this.isAttached) {
      this.attachedController.abort();
      this.animator = undefined;
      this.abortController = undefined;
      this.block.detach();
    }
  }

  public on<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
  ): void {
    this.root.addEventListener(type, listener as EventListener, {
      signal: this.attachedController.signal,
    });
  }

  public animateClass(className: string, element?: Element): Promise<void> {
    assertIsDefined(this.animator, 'Expected an attached DOM animator');

    return this.animator.animateClass(className, element);
  }

  public transition(change: () => void): Promise<void> {
    assertIsDefined(this.animator, 'Expected an attached DOM animator');

    return this.animator.transition(change);
  }

  private get attachedController(): AbortController {
    assertIsDefined(
      this.abortController,
      'Expected an attached DOM controller',
    );

    return this.abortController;
  }
}
