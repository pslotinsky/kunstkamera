import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';

import { ProvinceInfoView } from './ProvinceInfoView';

export class ProvinceInfoControl extends Control<ProvinceInfoView> {
  public constructor() {
    super(ProvinceInfoView, {});
  }

  public showHint(): void {
    this.view.showHint();
  }

  public showProvince(province: Province): void {
    this.view.showProvince(province);
  }

  public actualizeProvince(province: Province): void {
    this.view.actualizeProvince(province);
  }
}
