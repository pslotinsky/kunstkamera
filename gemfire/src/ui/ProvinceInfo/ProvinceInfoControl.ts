import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';

import { ProvinceInfoView } from './ProvinceInfoView';

export class ProvinceInfoControl extends Control<ProvinceInfoView> {
  public constructor() {
    super(ProvinceInfoView, {});
  }

  public showHint(): void {
    this.update({ selection: undefined });
  }

  public showProvince(
    province: Province,
    neighbors: readonly Province[],
  ): void {
    const crestUrl = province.owner
      ? `/crests/${province.owner.name.toLowerCase()}.png`
      : undefined;

    this.update({ selection: { province, neighbors, crestUrl } });
  }
}
