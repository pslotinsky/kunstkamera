import type { HiredUnit } from '@/core/domain/HiredUnit';

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
    return this.hireableUnits.map((unit) => unit.name);
  }

  public get hireableUnits(): readonly HiredUnit[] {
    return this.currentProvince?.fifthUnits.hireableUnits ?? [];
  }

  public get stationedUnits(): readonly HiredUnit[] {
    return this.currentProvince?.fifthUnits.hiredUnits ?? [];
  }

  public execute(): void {
    if (this.mode === 'dismiss') {
      this.runDismiss();
    } else {
      this.runHire();
    }
  }

  protected override recordAction(goodwill: number): void {
    const { world } = this.context;
    const province = this.currentProvince;

    if (province && !world.isPlayerRun(province)) {
      super.recordAction(goodwill);
    }
  }

  private runHire(): void {
    const province = this.currentProvince;
    const unit = this.hireableUnits.find(
      (offered) => offered.name === this.chosen,
    );

    if (province && unit && province.resources.gold >= unit.cost) {
      province.reduceResources({ gold: unit.cost });
      province.fifthUnits.hireUnit(unit);
      this.complete(province);
    }
  }

  private runDismiss(): void {
    const province = this.currentProvince;
    const unit = this.stationedUnits.find(
      (stationed) => stationed.name === this.chosen,
    );

    if (province && unit) {
      province.fifthUnits.dismissUnit(unit);
      this.complete(province);
    }
  }
}
