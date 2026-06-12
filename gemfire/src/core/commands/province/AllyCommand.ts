import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class AllyCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Ally', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
