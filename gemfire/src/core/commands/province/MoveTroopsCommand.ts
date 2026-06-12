import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class MoveTroopsCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Move Troops', context);
  }

  public execute(): void {
    const { world, events } = this.context;

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
  }
}
