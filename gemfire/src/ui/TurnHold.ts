import { TurnHeldEvent } from '@/core/events/TurnHeldEvent';
import { TurnReleasedEvent } from '@/core/events/TurnReleasedEvent';
import type { EventBus } from '@/lib/EventBus';

export class TurnHold {
  private readonly events: EventBus;

  public constructor(events: EventBus) {
    this.events = events;
  }

  public hold(): void {
    this.events.publish(new TurnHeldEvent(this));
  }

  public release(): void {
    this.events.publish(new TurnReleasedEvent(this));
  }
}
