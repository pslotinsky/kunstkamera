import { ComputerPlayer } from '@/core/ai/ComputerPlayer';
import { CommandExecutor } from '@/core/CommandExecutor';
import { ConcludeBattleCommand } from '@/core/commands/ConcludeBattleCommand';
import { LifecycleCommand } from '@/core/commands/LifecycleCommand';
import { MigrateMercenariesCommand } from '@/core/commands/MigrateMercenariesCommand';
import { RecoverHiredUnitsCommand } from '@/core/commands/RecoverHiredUnitsCommand';
import { ResolveEventsCommand } from '@/core/commands/ResolveEventsCommand';
import { RestockHirePoolsCommand } from '@/core/commands/RestockHirePoolsCommand';
import { TaxAndHarvestCommand } from '@/core/commands/TaxAndHarvestCommand';
import { UpkeepCommand } from '@/core/commands/UpkeepCommand';
import type { BattleOutcome } from '@/core/domain/BattleOutcome';
import type { Invasion } from '@/core/domain/Invasion';
import type { InvasionReport } from '@/core/domain/InvasionReport';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { MonthEndedEvent } from '@/core/events/MonthEndedEvent';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnHeldEvent } from '@/core/events/TurnHeldEvent';
import { TurnReleasedEvent } from '@/core/events/TurnReleasedEvent';
import { TurnScheduledEvent } from '@/core/events/TurnScheduledEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { WarReportedEvent } from '@/core/events/WarReportedEvent';
import type { EventBus, EventClass } from '@/lib/EventBus';

export class WorldEngine {
  private readonly executor: CommandExecutor;
  private readonly computer: ComputerPlayer;
  private readonly lifecycle: LifecycleCommand;
  private readonly taxAndHarvest: TaxAndHarvestCommand;
  private readonly upkeep: UpkeepCommand;
  private readonly provinceEvents: ResolveEventsCommand;
  private readonly hiredUnitRecovery: RecoverHiredUnitsCommand;
  private readonly restockHirePools: RestockHirePoolsCommand;
  private readonly migrateMercenaries: MigrateMercenariesCommand;
  private readonly holders = new Set<object>();
  private readonly lifetime = new AbortController();

  private fought: Invasion | undefined;
  private started: number | undefined;
  private phase:
    | 'start-month'
    | 'lifecycle'
    | 'events'
    | 'harvest'
    | 'recovery'
    | 'market'
    | 'hire-pools'
    | 'waiting-turn'
    | 'reporting-turn'
    | 'ready-turn'
    | 'taking-turn'
    | 'upkeep'
    | 'next-turn'
    | 'next-month' = 'start-month';

  public constructor(
    private readonly world: World,
    private readonly events: EventBus,
  ) {
    this.executor = new CommandExecutor({ world, events });
    this.computer = new ComputerPlayer({ world, events });
    this.lifecycle = new LifecycleCommand({ world, events });
    this.taxAndHarvest = new TaxAndHarvestCommand({ world, events });
    this.upkeep = new UpkeepCommand({ world, events });
    this.provinceEvents = new ResolveEventsCommand({ world, events });
    this.hiredUnitRecovery = new RecoverHiredUnitsCommand({ world, events });
    this.restockHirePools = new RestockHirePoolsCommand({ world, events });
    this.migrateMercenaries = new MigrateMercenariesCommand({ world, events });
  }

  public start(): void {
    this.listen(TurnEndedEvent, (event) =>
      this.handleTurnEnd(event.turnNumber),
    );
    this.listen(MonthStartedEvent, () => {
      if (this.phase === 'harvest') {
        this.advance();
      }
    });
    this.listen(MonthEndedEvent, () => {
      if (this.phase === 'next-month') {
        this.advance();
      }
    });
    this.listen(BattleStartedEvent, (event) => {
      this.fought = event.invasion;
    });
    this.listen(BattleReportedEvent, ({ report }) =>
      this.requestRansom(report),
    );
    this.listen(WarReportedEvent, ({ report }) => this.requestRansom(report));
    this.listen(TurnScheduledEvent, () => {
      if (this.phase === 'waiting-turn') {
        this.advance();
      }
    });
    this.listen(TurnHeldEvent, (event) => {
      this.holders.add(event.holder);
    });
    this.listen(TurnReleasedEvent, (event) => {
      this.holders.delete(event.holder);
      queueMicrotask(() => this.advance());
    });
    this.listen(BattleEndedEvent, (event) => {
      this.settleBattle(event.outcome, event.refuge);
    });
    this.advance();
  }

  public stop(): void {
    this.lifetime.abort();
  }

  private requestRansom({ captive }: InvasionReport): void {
    if (captive) {
      this.computer.demandRansom(captive);
    }
  }

  private advance(): void {
    if (
      this.lifetime.signal.aborted ||
      !this.world.campaign.canProgress ||
      this.holders.size > 0
    ) {
      return;
    }

    switch (this.phase) {
      case 'start-month':
        this.startMonth();
        break;
      case 'lifecycle':
        this.processLifecycle();
        break;
      case 'events':
        this.resolveEvents();
        break;
      case 'harvest':
        this.collectTaxAndHarvest();
        break;
      case 'recovery':
        this.recoverHiredUnits();
        break;
      case 'market':
        this.updateMarket();
        break;
      case 'hire-pools':
        this.refreshHirePools();
        break;
      case 'waiting-turn':
        this.startTurn();
        break;
      case 'reporting-turn':
        this.reportTurnEvents();
        break;
      case 'ready-turn':
        this.takeTurn();
        break;
      case 'upkeep':
        this.chargeUpkeep();
        break;
      case 'next-turn':
        this.nextTurn();
        break;
      case 'next-month':
        this.world.date = this.world.date.next();
        this.startMonth();
        break;
      case 'taking-turn':
        break;
    }
  }

  private settleBattle(outcome: BattleOutcome, refuge?: Province): void {
    const invasion = this.fought;

    if (invasion) {
      this.fought = undefined;
      const { turnNumber } = this.world.turnQueue;
      const command = new ConcludeBattleCommand(
        { world: this.world, events: this.events },
        { invasion, outcome, refuge },
      );

      this.executor.execute(command);
      this.events.afterDispatch(() =>
        this.events.publish(new TurnEndedEvent(turnNumber)),
      );
    }
  }

  private handleTurnEnd(turnNumber: number): void {
    if (this.phase === 'taking-turn' && turnNumber === this.started) {
      this.started = undefined;
      this.phase = 'next-turn';
      this.advance();
    }
  }

  private startMonth(): void {
    this.world.turnQueue.reset();
    this.phase = 'harvest';
    this.events.publish(new MonthStartedEvent(this.world.date));
  }

  private processLifecycle(): void {
    this.executor.execute(this.lifecycle);

    if (this.lifecycle.isComplete) {
      this.phase = 'upkeep';
    }

    this.events.afterDispatch(() => this.advance());
  }

  private resolveEvents(): void {
    this.phase = 'recovery';
    this.executor.execute(this.provinceEvents);
    this.events.afterDispatch(() => this.advance());
  }

  private recoverHiredUnits(): void {
    this.phase = 'market';
    this.executor.execute(this.hiredUnitRecovery);
    this.events.afterDispatch(() => this.advance());
  }

  private collectTaxAndHarvest(): void {
    this.phase = 'lifecycle';
    this.executor.execute(this.taxAndHarvest);
    this.events.afterDispatch(() => this.advance());
  }

  private updateMarket(): void {
    this.world.market.swing(this.world.date.month);
    this.phase = 'hire-pools';
    this.advance();
  }

  private refreshHirePools(): void {
    this.executor.execute(this.restockHirePools);
    this.executor.execute(this.migrateMercenaries);
    this.phase = 'waiting-turn';
    this.events.publish(new TurnScheduledEvent());
  }

  private startTurn(): void {
    const { current, turnNumber } = this.world.turnQueue;

    if (current) {
      this.started = turnNumber;
      this.phase = 'reporting-turn';
      this.events.publish(new TurnStartedEvent(turnNumber, current));
      this.events.afterDispatch(() => this.advance());
    }
  }

  private reportTurnEvents(): void {
    const { current } = this.world.turnQueue;

    this.phase = 'ready-turn';
    if (current) {
      this.provinceEvents.report(current);
    }
    this.events.afterDispatch(() => this.advance());
  }

  private takeTurn(): void {
    const province = this.world.turnQueue.current;

    this.phase = 'taking-turn';
    if (province && !this.world.isPlayerRun(province)) {
      const suspended = this.computer.play(province);

      if (!suspended) {
        this.events.publish(
          new TurnEndedEvent(this.world.turnQueue.turnNumber),
        );
      }
    }
  }

  private chargeUpkeep(): void {
    this.phase = 'events';
    this.executor.execute(this.upkeep);
    this.events.afterDispatch(() => this.advance());
  }

  private nextTurn(): void {
    this.world.turnQueue.next();

    if (this.world.turnQueue.isDone()) {
      this.phase = 'next-month';
      this.events.publish(new MonthEndedEvent(this.world.date));
    } else {
      this.phase = 'waiting-turn';
      this.events.publish(new TurnScheduledEvent());
    }
  }

  private listen<EventType extends object>(
    eventClass: EventClass<EventType>,
    handler: (event: EventType) => void,
  ): void {
    this.events.subscribe(eventClass, handler, this.lifetime.signal);
  }
}
