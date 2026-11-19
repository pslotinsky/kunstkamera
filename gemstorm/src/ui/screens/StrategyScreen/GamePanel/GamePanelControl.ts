import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';
import { ProvinceCommandsControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/ProvinceCommandsControl';
import { ProvinceInfoControl } from '@/ui/screens/StrategyScreen/ProvinceInfo/ProvinceInfoControl';

import { AdviceChosenEvent } from './AdviceChosenEvent';
import { GamePanelView } from './GamePanelView';
import { MenuChosenEvent } from './MenuChosenEvent';
import type { GamePanelContext, GamePanelControls } from './types';

export class GamePanelControl extends Control<
  GamePanelView,
  GamePanelControls
> {
  public constructor(context: GamePanelContext) {
    super(GamePanelView, context, {
      provinceInfo: new ProvinceInfoControl(),
      provinceCommands: new ProvinceCommandsControl(
        context.world,
        context.commands,
        context.events,
        context.dialogs,
        context.advice,
      ),
    });
  }

  public showHint(): void {
    this.controls.provinceInfo.showHint();
    this.controls.provinceCommands.hide();
    this.refreshAdvice();
  }

  public showProvince(province: Province): void {
    this.controls.provinceInfo.showProvince(province);

    if (this.isCommandsVisible(province)) {
      this.controls.provinceCommands.show();
    } else {
      this.controls.provinceCommands.hide();
    }

    this.refreshAdvice();
  }

  public hideCommands(): void {
    this.controls.provinceCommands.hide();
    this.refreshAdvice();
  }

  public showProvinceInfo(province: Province): void {
    this.controls.provinceInfo.showProvince(province);
    this.refreshAdvice();
  }

  public actualizeProvince(province: Province): void {
    this.controls.provinceInfo.actualizeProvince(province);
  }

  public pickTarget(province: Province): void {
    this.controls.provinceCommands.pickTarget(province);
  }

  public onMenu(handler: () => void): void {
    this.subscribe(MenuChosenEvent, handler);
  }

  protected override onMount(): void {
    this.subscribe(AdviceChosenEvent, () =>
      this.controls.provinceCommands.consultAdvisor(),
    );
    this.context.advice.onDismiss(() => this.view.focusAdvice());
  }

  private refreshAdvice(): void {
    this.view.enableAdvice(this.context.advice.isAvailable);
  }

  private isCommandsVisible(province: Province): boolean {
    const { world } = this.context;

    return (
      !world.campaign.isEnded &&
      world.isProvinceTurn(province) &&
      world.isPlayerRun(province)
    );
  }
}
