import type { Family } from '@/core/domain/Family';
import type { General } from '@/core/domain/General';
import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class ChangeLordCommand extends ProvinceCommand {
  private target: Province | undefined;
  private lord: General | undefined;

  public constructor(context: WorldCommandContext) {
    super('Change Lord', context);
  }

  public assignLord(province: Province, lord: General): void {
    this.target = province;
    this.lord = lord;
  }

  public ruleDirectly(province: Province): void {
    this.target = province;
    this.lord = undefined;
  }

  public override canExecute(): boolean {
    const province = this.currentProvince;

    return isDefined(province) && province.isHome;
  }

  public override get selectableTargets(): readonly number[] {
    let targets: readonly number[] = [];

    if (this.canExecute()) {
      const family = this.currentProvince?.family;

      targets = this.context.world
        .getFamilyProvinces(family!)
        .filter((province) => !province.isHome)
        .map((province) => province.number);
    }

    return targets;
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {
    const target = this.target ?? this.currentProvince;
    const family = target?.family;

    if (target && family && this.canExecute()) {
      this.reassign(target, family);
    }
  }

  private reassign(target: Province, family: Family): void {
    const displaced = target.governor;
    const vacated = this.lord
      ? this.context.world.getRuledProvince(this.lord)
      : undefined;

    target.assignGovernor(this.lord ?? family.ruler);

    if (vacated) {
      vacated.assignGovernor(displaced ?? family.ruler);
      this.publish(new ProvinceUpdatedEvent(vacated));
    }

    this.complete(target);
  }
}
