import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class RecruitCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Recruit', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
