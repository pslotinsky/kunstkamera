import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class GiveFoodCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Give Food', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
