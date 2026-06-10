import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';

import { ProvinceCommandsView } from './ProvinceCommandsView';

export class ProvinceCommandsControl extends Control<ProvinceCommandsView> {
  public constructor(player: Family) {
    super(ProvinceCommandsView, { player });
  }

  public showProvince(province: Province): void {
    this.update({ selection: province });
  }

  public clear(): void {
    this.update({ selection: undefined });
  }
}
