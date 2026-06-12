import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class ProtectionCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Protection', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
