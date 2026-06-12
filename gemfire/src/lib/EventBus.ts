export type EventClass<EventType> = new (...args: never[]) => EventType;

type Handler = (event: never) => void;

export class EventBus {
  private readonly subscribers = new Map<EventClass<unknown>, Handler[]>();
  private readonly observers: ((event: object) => void)[] = [];
  private readonly pending: object[] = [];

  private isDispatching = false;

  public publish(event: object): void {
    this.pending.push(event);

    if (!this.isDispatching) {
      this.dispatchPending();
    }
  }

  public subscribe<EventType extends object>(
    eventClass: EventClass<EventType>,
    handler: (event: EventType) => void,
  ): void {
    const handlers = this.subscribers.get(eventClass) ?? [];

    handlers.push(handler as Handler);
    this.subscribers.set(eventClass, handlers);
  }

  public observe(observer: (event: object) => void): void {
    this.observers.push(observer);
  }

  private dispatchPending(): void {
    this.isDispatching = true;

    try {
      let event = this.pending.shift();

      while (event) {
        for (const observer of this.observers) {
          observer(event);
        }

        this.dispatch(event);
        event = this.pending.shift();
      }
    } finally {
      this.isDispatching = false;
    }
  }

  private dispatch(event: object): void {
    const handlers =
      this.subscribers.get(event.constructor as EventClass<unknown>) ?? [];

    for (const handler of handlers) {
      (handler as (event: object) => void)(event);
    }
  }
}
