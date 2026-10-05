import { ComputerPlayer } from '@/core/ai/ComputerPlayer';
import { LifecycleCommand } from '@/core/commands/LifecycleCommand';
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
import { TurnHeldEvent } from '@/core/events/TurnHeldEvent';
import { TurnReleasedEvent } from '@/core/events/TurnReleasedEvent';
import { TurnScheduledEvent } from '@/core/events/TurnScheduledEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import type { EventBus } from '@/lib/EventBus';

export class WorldEngine {
  private readonly computer: ComputerPlayer;
  private readonly lifecycle: LifecycleCommand;
  private readonly taxAndHarvest: TaxAndHarvestCommand;
  private readonly upkeep: UpkeepCommand;

  private readonly holders = new Set<object>();

  private fought?: Invasion | undefined;
  private started?: number | undefined;
  private isWaiting = false;

  public constructor(
    private readonly world: World,
    private readonly events: EventBus,
  ) {
    this.computer = new ComputerPlayer({ world, events });
    this.lifecycle = new LifecycleCommand({ world, events });
    this.taxAndHarvest = new TaxAndHarvestCommand({ world, events });
    this.upkeep = new UpkeepCommand({ world, events });
  }

  public start(): void {
    this.events.subscribe(TurnStartedEvent, (event) => {
      this.handleTurnStart(event.province);
    });
    this.events.subscribe(TurnEndedEvent, (event) =>
      this.handleTurnEnd(event.turnNumber),
    );
    this.events.subscribe(MonthStartedEvent, () => this.handleMonthStart());
    this.events.subscribe(MonthEndedEvent, () => this.handleMonthEnd());
    this.events.subscribe(BattleStartedEvent, (event) => {
      this.fought = event.invasion;
    });
    this.events.subscribe(TurnScheduledEvent, () => this.startTurn());
    this.events.subscribe(TurnHeldEvent, (event) => {
      this.holders.add(event.holder);
    });
    this.events.subscribe(TurnReleasedEvent, (event) => {
      this.holders.delete(event.holder);
      queueMicrotask(() => this.resumeTurn());
    });
    this.events.subscribe(BattleEndedEvent, (event) => {
      this.settleBattle(event.outcome, event.refuge);
    });
    this.startMonth();
  }

  private settleBattle(outcome: BattleOutcome, refuge?: Province): void {
    const invasion = this.fought;

    if (invasion) {
      this.fought = undefined;

      const report = invasion.conclude(outcome, refuge);

      this.events.publish(new BattleReportedEvent(report));

      for (const province of invasion.affected) {
        this.events.publish(new ProvinceUpdatedEvent(province));
      }

      this.events.publish(new TurnEndedEvent(this.world.turnQueue.turnNumber));
    }
  }

  private handleTurnStart(province: Province): void {
    if (!this.world.isDefeated && !this.world.isPlayerRun(province)) {
      const suspended = this.computer.play(province);

      if (!suspended) {
        this.events.publish(
          new TurnEndedEvent(this.world.turnQueue.turnNumber),
        );
      }
    }
  }

  private handleTurnEnd(turnNumber: number): void {
    if (turnNumber === this.started) {
      this.started = undefined;
      this.upkeep.execute();
      this.world.turnQueue.next();

      if (this.world.turnQueue.isDone()) {
        this.events.publish(new MonthEndedEvent(this.world.date));
      } else {
        this.scheduleTurn();
      }
    }
  }

  private handleMonthStart(): void {
    this.lifecycle.execute();
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
    this.scheduleTurn();
  }

  private scheduleTurn(): void {
    this.events.publish(new TurnScheduledEvent());
  }

  private startTurn(): void {
    const { current, turnNumber } = this.world.turnQueue;

    this.isWaiting = this.holders.size > 0;

    if (current && !this.isWaiting) {
      this.started = turnNumber;
      this.events.publish(new TurnStartedEvent(turnNumber, current));
    }
  }

  private resumeTurn(): void {
    if (this.isWaiting && this.holders.size === 0) {
      this.startTurn();
    }
  }
}
