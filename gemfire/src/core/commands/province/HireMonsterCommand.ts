import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class HireMonsterCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Hire Monster', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
