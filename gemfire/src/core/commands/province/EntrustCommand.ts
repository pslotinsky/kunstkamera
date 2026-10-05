import type { Province } from '@/core/domain/Province';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export type EntrustMode = 'entrust' | 'cancel';

export class EntrustCommand extends ProvinceCommand {
  private target: Province | undefined;
  private mode: EntrustMode = 'entrust';

  public constructor(context: WorldCommandContext) {
    super('Entrust', context);
  }

  public entrust(province: Province): void {
    this.target = province;
    this.mode = 'entrust';
  }

  public cancel(province: Province): void {
    this.target = province;
    this.mode = 'cancel';
  }

  public override canExecute(): boolean {
    return this.currentProvince?.isHome ?? false;
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public override get selectableTargets(): readonly number[] {
    const family = this.currentProvince?.family;

    return family && this.canExecute()
      ? this.context.world
          .getFamilyProvinces(family)
          .filter((province) => province.canEntrust())
          .map((province) => province.number)
      : [];
  }

  public execute(): void {
    const target = this.target;

    if (target && this.selectableTargets.includes(target.number)) {
      if (this.mode === 'entrust') {
        target.entrust();
      } else {
        target.cancelEntrust();
      }

      this.complete(target);
    }
  }
}
