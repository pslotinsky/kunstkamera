import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';
import { ProvinceCommandsControl } from '@/ui/ProvinceCommands/ProvinceCommandsControl';
import { ProvinceInfoControl } from '@/ui/ProvinceInfo/ProvinceInfoControl';

import { GamePanelView } from './GamePanelView';
import type { GamePanelContext, GamePanelControls } from './types';

export class GamePanelControl extends Control<
  GamePanelView,
  GamePanelControls
> {
  public constructor(context: GamePanelContext) {
    super(GamePanelView, context, {
      provinceInfo: new ProvinceInfoControl(context.world.player),
      provinceCommands: new ProvinceCommandsControl(context.world.player),
    });
  }

  public showHint(): void {
    this.controls.provinceInfo.showHint();
    this.controls.provinceCommands.clear();
  }

  public showProvince(province: Province): void {
    this.controls.provinceInfo.showProvince(province);
    this.controls.provinceCommands.showProvince(province);
  }
}
