import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';

import { ProvinceInfoView } from './ProvinceInfoView';

export class ProvinceInfoControl extends Control<ProvinceInfoView> {
  public constructor(player: Family) {
    super(ProvinceInfoView, { player });
  }

  public showHint(): void {
    this.view.showHint();
  }

  public showProvince(province: Province): void {
    this.view.showProvince(province);
  }
}
