import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export type { WorldCommandContext };

export abstract class ProvinceCommand extends WorldCommand {
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
