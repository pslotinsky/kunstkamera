import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class DevelopCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Develop', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
