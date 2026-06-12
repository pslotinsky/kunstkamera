import { EventBus, type EventClass } from './EventBus';

export type AnyView = View<any, any>;
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

  public abstract render(): string;

  public mount(container: HTMLElement): void {
    this.element = this.renderToElement();
    container.append(this.element);
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
    this.events.subscribe(eventClass, handler);
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

  private findRootOrFail(container: HTMLElement): HTMLElement {
    const root = container.querySelector<HTMLElement>(`.${this.rootClass}`);

    if (!root) {
      throw new Error(`.${this.rootClass} not found in container`);
    }

    return root;
  }

  private renderToElement(): HTMLElement {
    const template = document.createElement('template');

    template.innerHTML = this.render().trim();

    return template.content.firstElementChild as HTMLElement;
  }
}
