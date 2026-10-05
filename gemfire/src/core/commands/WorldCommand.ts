import type { World } from '@/core/domain/World';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import type { EventBus } from '@/lib/EventBus';

import { Battle } from '../domain/Battle';
import type { Invasion } from '../domain/Invasion';
import type { InvasionReport } from '../domain/InvasionReport';
import type { Province } from '../domain/Province';
import { BattleReportedEvent } from '../events/BattleReportedEvent';
import { BattleStartedEvent } from '../events/BattleStartedEvent';

export interface WorldCommandContext {
  readonly world: World;
  readonly events: EventBus;
}

export abstract class WorldCommand {
  public readonly label: string;

  protected readonly context: WorldCommandContext;

  public constructor(label: string, context: WorldCommandContext) {
    this.label = label;
    this.context = context;
  }

  public abstract execute(): void;

  public canExecute(): boolean {
    return true;
  }

  public consumesTurn(): boolean {
    return true;
  }

  public suspendsTurn(): boolean {
    return false;
  }

  public get selectableTargets(): readonly number[] {
    return [];
  }

  public get requiresTarget(): boolean {
    return this.selectableTargets.length > 0;
  }

  protected get currentProvince(): Province | undefined {
    const { world } = this.context;

    return world.turnQueue.current;
  }

  protected publish(event: object): void {
    this.context.events.publish(event);
  }

  protected publishInvasion(
    invasion: Invasion,
    started: Battle | InvasionReport,
  ): void {
    if (started instanceof Battle) {
      this.publish(new BattleStartedEvent(invasion, started));
    } else {
      this.publish(new BattleReportedEvent(started));
      this.publishUpdates(invasion.affected);
    }
  }

  protected publishUpdates(provinces: readonly Province[]): void {
    for (const province of provinces) {
      this.publish(new ProvinceUpdatedEvent(province));
    }
  }
}
