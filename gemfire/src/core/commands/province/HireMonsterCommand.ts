import { HiredUnit } from '@/core/domain/HiredUnit';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class HireMonsterCommand extends ProvinceCommand {
  private hiring: string | undefined;

  public constructor(context: WorldCommandContext) {
    super('Hire Monster', context);
  }

  public hire(type: string): void {
    this.hiring = type;
  }

  public get hireableTypes(): readonly string[] {
    const province = this.currentProvince;

    return province
      ? province.hirePool.filter((type) => !province.hasUnit(type))
      : [];
  }

  public execute(): void {
    const province = this.currentProvince;
    const unit = this.hiring ? HiredUnit.ofType(this.hiring) : undefined;

    if (
      province &&
      unit &&
      province.hirePool.includes(unit.type) &&
      !province.hasUnit(unit.type) &&
      province.resources.gold >= unit.cost
    ) {
      province.addResources({ gold: -unit.cost });
      province.addUnit(unit);
      this.complete(province);
    }
  }
}
