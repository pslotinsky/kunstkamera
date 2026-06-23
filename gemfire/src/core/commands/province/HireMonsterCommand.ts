import { HiredUnit } from '@/core/domain/HiredUnit';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export type HireMode = 'hire' | 'dismiss';

export class HireMonsterCommand extends ProvinceCommand {
  private mode: HireMode = 'hire';
  private chosen: string | undefined;

  public constructor(context: WorldCommandContext) {
    super('Hire Monster', context);
  }

  public hire(type: string): void {
    this.mode = 'hire';
    this.chosen = type;
  }

  public dismiss(type: string): void {
    this.mode = 'dismiss';
    this.chosen = type;
  }

  public get hireableTypes(): readonly string[] {
    const province = this.currentProvince;

    return province
      ? province.hirePool.filter((type) => !province.hasUnit(type))
      : [];
  }

  public get stationedUnits(): readonly HiredUnit[] {
    return this.currentProvince?.hiredUnits ?? [];
  }

  public execute(): void {
    if (this.mode === 'dismiss') {
      this.runDismiss();
    } else {
      this.runHire();
    }
  }

  private runHire(): void {
    const province = this.currentProvince;
    const unit = this.chosen ? HiredUnit.ofType(this.chosen) : undefined;

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

  private runDismiss(): void {
    const province = this.currentProvince;
    const unit = this.stationedUnits.find(
      (stationed) => stationed.type === this.chosen,
    );

    if (province && unit) {
      province.removeUnit(unit);
      this.complete(province);
    }
  }
}
