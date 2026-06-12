import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class HireMonsterCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Hire Monster', context);
  }

  public execute(): void {
    const { world, events } = this.context;

    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
  }
}
