import type { Html, Template } from '@/lib/template';
import { uuid } from '@/lib/utils/uuid';

import type { Attachable } from './attachable';
import { ControlChildren } from './control-children';
import { ControlDom } from './control-dom';
import { ControlSignals } from './control-signals';

export abstract class Control<
  TParams = unknown,
  TChildren extends Record<string, unknown> = Record<string, unknown>,
> implements Attachable
{
  public readonly id: string;

  protected readonly params: TParams;
  protected readonly dom: ControlDom;
  protected readonly children: ControlChildren<TChildren>;
  protected readonly template: Template<TParams, TChildren>;
  protected readonly signals: ControlSignals = new ControlSignals();

  constructor(params: TParams) {
    this.id = uuid();
    this.params = params;
    this.dom = new ControlDom(this.id);
    this.children = new ControlChildren(this.createChildren(this.params));
    this.template = this.createTemplate();
  }

  public render(): Html {
    return this.template.render({
      controlId: this.id,
      params: this.params,
      children: this.children.tree,
    });
  }

  public attach(container: Element): void {
    if (!this.dom.isAttached) {
      const element = this.dom.attach(container);
      this.children.attach(element);
      this.onAttach();
    }
  }

  public detach(): void {
    if (this.dom.isAttached) {
      this.children.detach();
      this.onDetach();
      this.signals.clear();
      this.dom.detach();
    }
  }

  protected onAttach(): void {}

  protected onDetach(): void {}

  protected createChildren(_params: TParams): TChildren {
    return {} as TChildren;
  }

  protected abstract createTemplate(): Template<TParams, TChildren>;
}
