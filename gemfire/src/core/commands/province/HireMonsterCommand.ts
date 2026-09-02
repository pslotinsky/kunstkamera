import { HiredUnit } from '@/core/domain/HiredUnit';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export type HireMode = 'hire' | 'dismiss';

export class HireMonsterCommand extends ProvinceCommand {
  private mode: HireMode = 'hire';
  private chosen: string | undefined;

  public constructor(context: WorldCommandContext) {
    super('Hire Monster', context);
  }

  public hire(name: string): void {
    this.mode = 'hire';
    this.chosen = name;
  }

  public dismiss(name: string): void {
    this.mode = 'dismiss';
    this.chosen = name;
  }

  public get hireableNames(): readonly string[] {
    const province = this.currentProvince;

    return province
      ? province.hirePool.filter((name) => !province.hasUnit(name))
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
    const unit = this.chosen ? HiredUnit.ofName(this.chosen) : undefined;

    if (
      province &&
      unit &&
      province.hirePool.includes(unit.name) &&
      !province.hasUnit(unit.name) &&
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
      (stationed) => stationed.name === this.chosen,
    );

    if (province && unit) {
      province.removeUnit(unit);
      this.complete(province);
    }
  }
}
