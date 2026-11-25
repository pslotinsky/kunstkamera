import type { EventBus } from '@/lib/EventBus';

import { TurnHeldEvent } from './events/TurnHeldEvent';
import { TurnReleasedEvent } from './events/TurnReleasedEvent';

export type TurnHoldKind = 'interruption' | 'pause';

export class TurnHold {
  private readonly events: EventBus;

  public constructor(
    events: EventBus,
    public readonly kind: TurnHoldKind = 'interruption',
  ) {
    this.events = events;
  }

  public hold(): void {
    this.events.publish(new TurnHeldEvent(this));
  }

  public release(): void {
    this.events.publish(new TurnReleasedEvent(this));
  }
}
