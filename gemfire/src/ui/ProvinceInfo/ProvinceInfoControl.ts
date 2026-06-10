import type { Province } from '@/core/domain/Province';
import type { WorldMap } from '@/core/domain/WorldMap';
import { Control } from '@/lib/Control';

import { ProvinceInfoView } from './ProvinceInfoView';

export class ProvinceInfoControl extends Control<ProvinceInfoView> {
  public constructor(map: WorldMap) {
    super(ProvinceInfoView, { map });
  }

  public showHint(): void {
    this.update({ selection: undefined });
  }

  public showProvince(province: Province): void {
    this.update({ selection: province });
  }
}
