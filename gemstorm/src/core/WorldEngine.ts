import { ComputerPlayer } from '@/core/ai/ComputerPlayer';
import { CommandExecutor } from '@/core/CommandExecutor';
import { ConcludeBattleCommand } from '@/core/commands/ConcludeBattleCommand';
import { LifecycleCommand } from '@/core/commands/LifecycleCommand';
import { ResolveEventsCommand } from '@/core/commands/ResolveEventsCommand';
import { TaxAndHarvestCommand } from '@/core/commands/TaxAndHarvestCommand';
import { UpkeepCommand } from '@/core/commands/UpkeepCommand';
import type { BattleOutcome } from '@/core/domain/BattleOutcome';
import type { Invasion } from '@/core/domain/Invasion';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { MonthEndedEvent } from '@/core/events/MonthEndedEvent';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnHeldEvent } from '@/core/events/TurnHeldEvent';
import { TurnReleasedEvent } from '@/core/events/TurnReleasedEvent';
import { TurnScheduledEvent } from '@/core/events/TurnScheduledEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import type { EventBus } from '@/lib/EventBus';

export class WorldEngine {
  private readonly executor: CommandExecutor;
  private readonly computer: ComputerPlayer;
  private readonly lifecycle: LifecycleCommand;
  private readonly taxAndHarvest: TaxAndHarvestCommand;
  private readonly upkeep: UpkeepCommand;
  private readonly provinceEvents: ResolveEventsCommand;
  private readonly holders = new Set<object>();

  private fought: Invasion | undefined;
  private started: number | undefined;
  private phase:
    | 'start-month'
    | 'lifecycle'
    | 'events'
    | 'tax'
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
  }

  public start(): void {
    this.events.subscribe(TurnEndedEvent, (event) =>
      this.handleTurnEnd(event.turnNumber),
    );
    this.events.subscribe(MonthStartedEvent, () => {
      if (this.phase === 'lifecycle') {
        this.advance();
      }
    });
    this.events.subscribe(MonthEndedEvent, () => {
      if (this.phase === 'next-month') {
        this.advance();
      }
    });
    this.events.subscribe(BattleStartedEvent, (event) => {
      this.fought = event.invasion;
    });
    this.events.subscribe(TurnScheduledEvent, () => {
      if (this.phase === 'waiting-turn') {
        this.advance();
      }
    });
    this.events.subscribe(TurnHeldEvent, (event) => {
      this.holders.add(event.holder);
    });
    this.events.subscribe(TurnReleasedEvent, (event) => {
      this.holders.delete(event.holder);
      queueMicrotask(() => this.advance());
    });
    this.events.subscribe(BattleEndedEvent, (event) => {
      this.settleBattle(event.outcome, event.refuge);
    });
    this.advance();
  }

  private advance(): void {
    if (!this.world.campaign.canProgress || this.holders.size > 0) {
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
      case 'tax':
        this.collectTaxAndHarvest();
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
      const command = new ConcludeBattleCommand(
        { world: this.world, events: this.events },
        { invasion, outcome, refuge },
      );

      this.executor.execute(command);
      this.events.publish(new TurnEndedEvent(this.world.turnQueue.turnNumber));
    }
  }

  private handleTurnEnd(turnNumber: number): void {
    if (this.phase === 'taking-turn' && turnNumber === this.started) {
      this.started = undefined;
      this.phase = 'upkeep';
      this.advance();
    }
  }

  private startMonth(): void {
    this.world.turnQueue.reset();
    this.phase = 'lifecycle';
    this.events.publish(new MonthStartedEvent(this.world.date));
  }

  private processLifecycle(): void {
    this.executor.execute(this.lifecycle);

    if (this.lifecycle.isComplete) {
      this.phase = 'events';
    }

    this.events.afterDispatch(() => this.advance());
  }

  private resolveEvents(): void {
    this.phase = 'tax';
    this.executor.execute(this.provinceEvents);
    this.events.afterDispatch(() => this.advance());
  }

  private collectTaxAndHarvest(): void {
    this.world.market.swing(this.world.date.month);
    this.executor.execute(this.taxAndHarvest);
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
    this.phase = 'next-turn';
    this.executor.execute(this.upkeep);
    this.advance();
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
}
