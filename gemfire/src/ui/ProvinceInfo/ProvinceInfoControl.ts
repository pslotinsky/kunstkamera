import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';
import type { WorldMap } from '@/core/domain/WorldMap';
import { Control } from '@/lib/Control';

import { ProvinceInfoView } from './ProvinceInfoView';

export class ProvinceInfoControl extends Control<ProvinceInfoView> {
  public constructor(map: WorldMap, player: Family) {
    super(ProvinceInfoView, { map, player });
  }

  public showHint(): void {
    this.update({ selection: undefined });
  }

  public showProvince(province: Province): void {
    this.update({ selection: province });
  }
}
