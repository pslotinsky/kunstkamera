import type { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { AutoBattle } from '@/core/domain/battle-ai/AutoBattle';
import { Invasion } from '@/core/domain/Invasion';
import type { InvasionReport } from '@/core/domain/InvasionReport';
import type { Province } from '@/core/domain/Province';
import { DefenseRequestedEvent } from '@/core/events/DefenseRequestedEvent';
import { WarReportedEvent } from '@/core/events/WarReportedEvent';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const ATTACK_GOODWILL = -1;

export class AttackCommand extends ProvinceCommand {
  private target: Province | undefined;
  private attacker: Army | undefined;
  private suspended = false;

  public constructor(context: WorldCommandContext) {
    super('Attack', context);
  }

  public attackAt(target: Province, attacker: Army): void {
    this.target = target;
    this.attacker = attacker;
  }

  public override canExecute(): boolean {
    return this.requiresTarget;
  }

  public override suspendsTurn(): boolean {
    return this.suspended;
  }

  public override get selectableTargets(): readonly number[] {
    const source = this.currentProvince;

    return source
      ? this.context.world
          .getHostileNeighbors(source)
          .map((province) => province.number)
      : [];
  }

  public execute(): void {
    this.suspended = false;

    const source = this.currentProvince;
    const target = this.target;
    const attacker = this.attacker;

    if (
      source &&
      target &&
      attacker &&
      this.canLaunch(source, target, attacker)
    ) {
      this.march(source, target, attacker);
    }
  }

  private canLaunch(
    source: Province,
    target: Province,
    attacker: Army,
  ): boolean {
    return (
      this.selectableTargets.includes(target.number) &&
      attacker.hasTroops &&
      attacker.supplyDays > 0 &&
      source.resources.troops >= attacker.troops &&
      source.resources.food >= attacker.food &&
      source.resources.gold >= attacker.deploymentCost
    );
  }

  private march(source: Province, target: Province, attacker: Army): void {
    const { world } = this.context;
    const invasion = new Invasion({ world, source, target, attacker });

    this.recordAction(ATTACK_GOODWILL);

    if (world.isComputerRun(target)) {
      this.fight(invasion);
    } else {
      this.suspended = true;
      invasion.muster();
      this.publish(new DefenseRequestedEvent(invasion));
    }
  }

  private fight(invasion: Invasion): void {
    const started = invasion.begin();

    if (this.context.world.isComputerRun(invasion.source)) {
      this.reportWar(invasion, started);
    } else {
      this.suspended = started instanceof Battle;
      this.publishInvasion(invasion, started);
    }
  }

  private reportWar(
    invasion: Invasion,
    started: Battle | InvasionReport,
  ): void {
    const report =
      started instanceof Battle
        ? invasion.conclude(new AutoBattle(started).fight())
        : started;

    this.suspended = true;
    this.publish(new WarReportedEvent(report));
    this.publishUpdates(invasion.affected);
  }
}
