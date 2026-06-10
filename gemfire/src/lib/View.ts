export type AnyView = View<any, any>;
export type ViewRecord = Record<string, AnyView>;

type EventClass<EventType extends Event> = {
  new (...args: never[]): EventType;
  readonly name: string;
};

export abstract class View<
  Context = Record<string, never>,
  Views extends ViewRecord = Record<string, never>,
> {
  protected abstract readonly rootClass: string;
  protected element!: HTMLElement;
  protected readonly context: Readonly<Context>;
  protected readonly views: Views;
  protected listeners = new AbortController();

  private readonly events = new EventTarget();

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
    this.listeners.abort();
    this.element.remove();
  }

  public rerender(): void {
    this.onUnmount();
    this.listeners.abort();
    this.listeners = new AbortController();

    const replacement = this.renderToElement();
    this.element.replaceWith(replacement);
    this.element = replacement;
    this.onMount();
  }

  public listen<EventType extends Event>(
    eventClass: EventClass<EventType>,
    handler: (event: EventType) => void,
  ): void {
    this.events.addEventListener(
      eventClass.name,
      (event) => {
        if (event instanceof eventClass) {
          handler(event);
        }
      },
      { signal: this.listeners.signal },
    );
  }

  protected dispatch(event: Event): void {
    this.events.dispatchEvent(event);
  }

  protected get listenerSignal(): AbortSignal {
    return this.listeners.signal;
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
