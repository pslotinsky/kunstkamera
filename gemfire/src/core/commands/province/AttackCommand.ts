import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class AttackCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Attack', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
