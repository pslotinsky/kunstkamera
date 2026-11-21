import type { Army } from '@/core/domain/Army';
import {
  AttackDeployment,
  type AttackForce,
} from '@/core/domain/AttackDeployment';
import { Battle } from '@/core/domain/Battle';
import { AutoBattle } from '@/core/domain/battle-ai/AutoBattle';
import { Invasion } from '@/core/domain/Invasion';
import type { InvasionReport } from '@/core/domain/InvasionReport';
import type { Province } from '@/core/domain/Province';
import { DefenseRequestedEvent } from '@/core/events/DefenseRequestedEvent';
import { WarReportedEvent } from '@/core/events/WarReportedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const ATTACK_GOODWILL = -1;

export class AttackCommand extends ProvinceCommand {
  private target: Province | undefined;
  private force: AttackForce | undefined;
  private suspended = false;

  public constructor(context: WorldCommandContext) {
    super('Attack', context);
  }

  public attackAt(target: Province, force: AttackForce): void {
    this.target = target;
    this.force = force;
  }

  public override canExecute(): boolean {
    const source = this.currentProvince;
    const days =
      isDefined(source) && this.context.world.isComputerRun(source)
        ? AttackDeployment.COMPUTER_SUPPLY_DAYS
        : AttackDeployment.MIN_SUPPLY_DAYS;
    const minimum = this.prepare({ troops: AttackDeployment.MIN_TROOPS, days });

    return this.requiresTarget && (minimum?.isAffordable ?? false);
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

    const { target, force } = this;
    const deployment = isDefined(force) ? this.prepare(force) : undefined;

    if (
      isDefined(target) &&
      isDefined(deployment) &&
      this.canLaunch(target, deployment)
    ) {
      this.march(deployment.source, target, deployment.muster());
    }
  }

  public prepare(force: AttackForce): AttackDeployment | undefined {
    const source = this.currentProvince;
    const commander = source?.residentGovernor ?? source?.family?.ruler;

    return isDefined(source) && isDefined(commander)
      ? new AttackDeployment(source, commander, force)
      : undefined;
  }

  public canLaunch(target: Province, deployment: AttackDeployment): boolean {
    return (
      this.canTarget(deployment.source, target) &&
      this.canSupply(deployment) &&
      this.canBringUnit(deployment)
    );
  }

  private canTarget(source: Province, target: Province): boolean {
    return (
      source === this.currentProvince &&
      this.context.world.getHostileNeighbors(source).includes(target)
    );
  }

  private canSupply(deployment: AttackDeployment): boolean {
    const { source, force } = deployment;
    const isComputerRun = this.context.world.isComputerRun(source);
    const hasRequiredDays =
      !isComputerRun || force.days === AttackDeployment.COMPUTER_SUPPLY_DAYS;

    return hasRequiredDays && deployment.isAffordable;
  }

  private canBringUnit(deployment: AttackDeployment): boolean {
    const { source, force } = deployment;
    const { unit } = force;

    return (
      !isDefined(unit) ||
      this.context.world.getFifthUnits(source).includes(unit)
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
