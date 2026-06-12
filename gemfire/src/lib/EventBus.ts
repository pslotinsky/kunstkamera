export type EventClass<EventType extends Event> = {
  new (...args: never[]): EventType;
  readonly name: string;
};

export class EventBus {
  private readonly events = new EventTarget();
  private readonly pending: Event[] = [];

  private isDispatching = false;

  public publish(event: Event): void {
    this.pending.push(event);

    if (!this.isDispatching) {
      this.dispatchPending();
    }
  }

  public subscribe<EventType extends Event>(
    eventClass: EventClass<EventType>,
    handler: (event: EventType) => void,
  ): void {
    this.events.addEventListener(eventClass.name, (event) => {
      if (event instanceof eventClass) {
        handler(event);
      }
    });
  }

  private dispatchPending(): void {
    this.isDispatching = true;

    try {
      let event = this.pending.shift();

      while (event) {
        this.events.dispatchEvent(event);
        event = this.pending.shift();
      }
    } finally {
      this.isDispatching = false;
    }
  }
}
