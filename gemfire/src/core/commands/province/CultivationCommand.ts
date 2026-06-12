import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';

import { WorldCommand, type WorldCommandContext } from '../WorldCommand';

export class CultivationCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Cultivation', context);
  }

  public execute(): void {
    this.context.events.publish(new TurnEndedEvent());
  }
}
