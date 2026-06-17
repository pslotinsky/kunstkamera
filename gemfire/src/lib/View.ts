import { render, type TemplateResult } from 'lit-html';

import { EventBus, type EventClass } from './EventBus';

export type AnyView = View<unknown, ViewRecord>;
export type ViewRecord = Record<string, AnyView>;

export abstract class View<
  Context = Record<string, never>,
  Views extends ViewRecord = Record<string, never>,
> {
  protected abstract readonly rootClass: string;
  protected element!: HTMLElement;
  protected readonly context: Readonly<Context>;
  protected readonly views: Views;
  protected readonly lifetime = new AbortController();

  private readonly events = new EventBus();

  public constructor(context: Readonly<Context>, views: Views) {
    this.context = context;
    this.views = views;
  }

  public abstract get template(): TemplateResult;

  public mount(container: HTMLElement): void {
    render(this.template, container);
    this.element = this.findRootOrFail(container);
    this.attachChildren();
    this.onMount();
  }

  public attach(container: HTMLElement): void {
    this.element = this.findRootOrFail(container);
    this.attachChildren();
    this.onMount();
  }

  public unmount(): void {
    this.onUnmount();
    this.unmountChildren();
    this.lifetime.abort();
    this.element.remove();
  }

  public subscribe<EventType extends object>(
    eventClass: EventClass<EventType>,
    handler: (event: EventType) => void,
  ): void {
    this.events.subscribe(eventClass, handler, this.lifetime.signal);
  }

  protected publish(event: object): void {
    this.events.publish(event);
  }

  protected onMount(): void {}

  protected onUnmount(): void {}

  private attachChildren(): void {
    for (const child of Object.values(this.views)) {
      child.attach(this.element);
    }
  }

  private unmountChildren(): void {
    for (const child of Object.values(this.views)) {
      child.unmount();
    }
  }

  protected get rootSelector(): string {
    return `.${this.rootClass}`;
  }

  private findRootOrFail(container: HTMLElement): HTMLElement {
    const root = container.querySelector<HTMLElement>(this.rootSelector);

    if (!root) {
      throw new Error(`${this.rootSelector} not found in container`);
    }

    return root;
  }
}
