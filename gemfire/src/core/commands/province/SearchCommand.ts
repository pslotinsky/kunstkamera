import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class SearchCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Search', context);
  }

  public execute(): void {
    const { world, events } = this.context;

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
  }
}
