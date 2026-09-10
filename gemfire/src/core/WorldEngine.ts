import { TaxAndHarvestCommand } from '@/core/commands/TaxAndHarvestCommand';
import { UpkeepCommand } from '@/core/commands/UpkeepCommand';
import type { BattleOutcome } from '@/core/domain/BattleOutcome';
import type { Invasion } from '@/core/domain/Invasion';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { MonthEndedEvent } from '@/core/events/MonthEndedEvent';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import type { EventBus } from '@/lib/EventBus';

export class WorldEngine {
  private readonly taxAndHarvest: TaxAndHarvestCommand;
  private readonly upkeep: UpkeepCommand;

  private fought?: Invasion | undefined;

  public constructor(
    private readonly world: World,
    private readonly events: EventBus,
  ) {
    this.taxAndHarvest = new TaxAndHarvestCommand({ world, events });
    this.upkeep = new UpkeepCommand({ world, events });
  }

  public start(): void {
    this.events.subscribe(TurnStartedEvent, (event) => {
      this.handleTurnStart(event.province);
    });
    this.events.subscribe(TurnEndedEvent, () => this.handleTurnEnd());
    this.events.subscribe(MonthStartedEvent, () => this.handleMonthStart());
    this.events.subscribe(MonthEndedEvent, () => this.handleMonthEnd());
    this.events.subscribe(BattleStartedEvent, (event) => {
      this.fought = event.invasion;
    });
    this.events.subscribe(BattleEndedEvent, (event) => {
      this.settleBattle(event.outcome);
    });
    this.startMonth();
  }

  private settleBattle(outcome: BattleOutcome): void {
    const invasion = this.fought;

    if (invasion) {
      this.fought = undefined;

      const report = invasion.conclude(outcome);

      this.events.publish(new BattleReportedEvent(report));

      for (const province of invasion.affected) {
        this.events.publish(new ProvinceUpdatedEvent(province));
      }

      this.events.publish(new TurnEndedEvent(this.world.turnQueue.turnNumber));
    }
  }

  private handleTurnStart(province: Province): void {
    if (!province.belongsTo(this.world.player)) {
      this.events.publish(new TurnEndedEvent(this.world.turnQueue.turnNumber));
    }
  }

  private handleTurnEnd(): void {
    this.upkeep.execute();
    this.world.turnQueue.next();

    if (this.world.turnQueue.isDone()) {
      this.events.publish(new MonthEndedEvent(this.world.date));
    } else {
      this.startTurn();
    }
  }

  private handleMonthStart(): void {
    this.world.market.swing(this.world.date.month);
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
    const { current, turnNumber } = this.world.turnQueue;

    if (current) {
      this.events.publish(new TurnStartedEvent(turnNumber, current));
    }
  }
}
