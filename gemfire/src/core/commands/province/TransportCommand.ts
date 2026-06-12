import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class TransportCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Transport', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
