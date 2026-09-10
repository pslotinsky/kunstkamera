import type { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import type { Family } from '@/core/domain/Family';
import { Invasion } from '@/core/domain/Invasion';
import type { Province } from '@/core/domain/Province';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

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
    const family = source?.family;

    return source && family
      ? this.context.world.map
          .getNeighbors(source)
          .filter((province) => this.isHostile(province, family))
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

  private isHostile(province: Province, family: Family): boolean {
    const { ally } = family;

    return (
      province.hasOwner() &&
      !province.belongsTo(family) &&
      !(ally !== undefined && province.belongsTo(ally))
    );
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
    const invasion = new Invasion({
      world: this.context.world,
      source,
      target,
      attacker,
    });
    const started = invasion.begin();

    this.recordAction(ATTACK_GOODWILL);
    this.suspended = started instanceof Battle;

    if (started instanceof Battle) {
      this.publish(new BattleStartedEvent(invasion, started));
    } else {
      this.publish(new BattleReportedEvent(started));
      this.announce(invasion.affected);
    }
  }

  private announce(provinces: readonly Province[]): void {
    for (const province of provinces) {
      this.publish(new ProvinceUpdatedEvent(province));
    }
  }
}
