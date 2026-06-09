export abstract class Component {
  protected abstract readonly rootClass: string;
  protected element!: HTMLElement;
  protected listeners = new AbortController();

  private readonly events = new EventTarget();

  public abstract render(): string;

  public mount(container: HTMLElement): void {
    this.element = this.renderToElement();
    container.append(this.element);
    this.onMount();
  }

  public attach(container: HTMLElement): void {
    this.element = this.findRootOrFail(container);
    this.onMount();
  }

  public unmount(): void {
    this.onUnmount();
    this.listeners.abort();
    this.element.remove();
  }

  public listen<EventType extends Event>(
    eventClass: { new (...args: never[]): EventType; readonly name: string },
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

  protected rerender(): void {
    this.onUnmount();
    this.listeners.abort();
    this.listeners = new AbortController();

    const replacement = this.renderToElement();
    this.element.replaceWith(replacement);
    this.element = replacement;
    this.onMount();
  }

  protected onMount(): void {}

  protected onUnmount(): void {}

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
