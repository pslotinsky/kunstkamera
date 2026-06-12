import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class DevelopCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Develop', context);
  }

  public execute(): void {
    const { world, events } = this.context;

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
  }
}
