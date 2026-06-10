import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';
import { ProvinceInfoControl } from '@/ui/ProvinceInfo/ProvinceInfoControl';

import { GamePanelView } from './GamePanelView';
import type { GamePanelContext, GamePanelControls } from './types';

export class GamePanelControl extends Control<
  GamePanelView,
  GamePanelControls
> {
  public constructor(context: GamePanelContext) {
    super(GamePanelView, context, {
      provinceInfo: new ProvinceInfoControl(context.world.map),
    });
  }

  public showHint(): void {
    this.controls.provinceInfo.showHint();
  }

  public showProvince(province: Province): void {
    this.controls.provinceInfo.showProvince(province);
  }
}
