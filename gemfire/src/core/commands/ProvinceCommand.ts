import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export type { WorldCommandContext };

const TURN_END_DELAY_MS = 800;

export abstract class ProvinceCommand extends WorldCommand {
  protected complete(province: Province, goodwill = 0): void {
    this.publish(new ProvinceUpdatedEvent(province));

    if (this.consumesTurn()) {
      this.recordAction(goodwill);
      this.endTurn(TURN_END_DELAY_MS);
    }
  }

  protected recordAction(goodwill = 0): void {
    const { turnQueue } = this.context.world;

    turnQueue.current?.recordAction(goodwill);
  }

  protected endTurn(delay = 0): void {
    const { world, events } = this.context;
    const publish = () =>
      events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));

    if (delay > 0) {
      setTimeout(publish, delay);
    } else {
      publish();
    }
  }
}
