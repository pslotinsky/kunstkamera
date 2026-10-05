import type { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { Invasion } from '@/core/domain/Invasion';
import type { Province } from '@/core/domain/Province';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';

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
      this.publishUpdates(invasion.affected);
    }
  }
}
