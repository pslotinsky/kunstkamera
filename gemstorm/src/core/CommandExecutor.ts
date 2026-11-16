import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import { CampaignEndedEvent } from '@/core/events/CampaignEndedEvent';

export class CommandExecutor {
  public constructor(private readonly context: WorldCommandContext) {}

  public execute(command: WorldCommand | undefined): void {
    const { events } = this.context;

    if (command && !command.isBlocked()) {
      events.batch(() => {
        command.execute();
        this.assess();
      });
    }
  }

  public assess(): void {
    const { world, events } = this.context;
    const outcome = world.campaign.assess();

    if (outcome) {
      events.publish(new CampaignEndedEvent(outcome));
    }
  }
}
