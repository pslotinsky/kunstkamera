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
      provinceCommands: new ProvinceCommandsControl(
        context.world,
        context.commands,
        context.events,
        context.overlayDialogs,
      ),
    });
  }

  public showHint(): void {
    this.controls.provinceInfo.showHint();
    this.controls.provinceCommands.hide();
  }

  public showProvince(province: Province): void {
    this.controls.provinceInfo.showProvince(province);

    if (this.isCommandsVisible(province)) {
      this.controls.provinceCommands.show();
    } else {
      this.controls.provinceCommands.hide();
    }
  }

  public showProvinceInfo(province: Province): void {
    this.controls.provinceInfo.showProvince(province);
  }

  public actualizeProvince(province: Province): void {
    this.controls.provinceInfo.actualizeProvince(province);
  }

  public pickTarget(province: Province): void {
    this.controls.provinceCommands.pickTarget(province);
  }

  private isCommandsVisible(province: Province): boolean {
    const { world } = this.context;

    return world.isProvinceTurn(province) && province.belongsTo(world.player);
  }
}
