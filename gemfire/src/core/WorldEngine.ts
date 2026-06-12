import { TaxAndHarvestCommand } from '@/core/commands/TaxAndHarvestCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { MonthEndedEvent } from '@/core/events/MonthEndedEvent';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import type { EventBus } from '@/lib/EventBus';

export class WorldEngine {
  private readonly taxAndHarvest: TaxAndHarvestCommand;

  public constructor(
    private readonly world: World,
    private readonly events: EventBus,
  ) {
    this.taxAndHarvest = new TaxAndHarvestCommand({ world, events });
  }

  public start(): void {
    this.events.subscribe(TurnStartedEvent, (event) => {
      this.handleTurnStart(event.province);
    });
    this.events.subscribe(TurnEndedEvent, () => this.handleTurnEnd());
    this.events.subscribe(MonthStartedEvent, () => this.handleMonthStart());
    this.events.subscribe(MonthEndedEvent, () => this.handleMonthEnd());
    this.startMonth();
  }

  private handleTurnStart(province: Province): void {
    if (!province.isOwner(this.world.player)) {
      this.events.publish(new TurnEndedEvent());
    }
  }

  private handleTurnEnd(): void {
    this.world.turnQueue.next();

    if (this.world.turnQueue.isDone()) {
      this.events.publish(new MonthEndedEvent());
    } else {
      this.startTurn();
    }
  }

  private handleMonthStart(): void {
    this.taxAndHarvest.execute();
  }

  private handleMonthEnd(): void {
    this.world.date = this.world.date.next();
    this.startMonth();
  }

  private startMonth(): void {
    this.world.turnQueue.reset();
    this.events.publish(new MonthStartedEvent(this.world.date));
    this.startTurn();
  }

  private startTurn(): void {
    const current = this.world.turnQueue.current;

    if (current) {
      this.events.publish(new TurnStartedEvent(current));
    }
  }
}
