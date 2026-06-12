import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class NegotiateCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Negotiate', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
