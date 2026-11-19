import type { CampaignStart } from '@/core/WorldFactory';
import { Control } from '@/lib/Control';
import { CampaignControl } from '@/ui/app/Campaign/CampaignControl';
import { NewGameScreenControl } from '@/ui/screens/NewGameScreen/NewGameScreenControl';
import { NewGameChosenEvent } from '@/ui/screens/TitleScreen/events/NewGameChosenEvent';
import { TitleScreenControl } from '@/ui/screens/TitleScreen/TitleScreenControl';

import { AppView } from './AppView';
import type { AppContext, AppControls } from './types';

export class AppControl extends Control<AppView, AppControls> {
  private campaign?: CampaignControl | undefined;

  public constructor(context: AppContext) {
    super(AppView, context, {
      titleScreen: new TitleScreenControl({ sounds: context.sounds }),
      newStrategyScreen: new NewGameScreenControl(),
    });
  }

  protected override onMount(): void {
    const { titleScreen: title, newStrategyScreen: newGame } = this.controls;
    title.view.subscribe(NewGameChosenEvent, () => {
      title.hide();
      newGame.show();
    });
    newGame.onBack(() => title.show());
    newGame.onBegin((start) => this.startCampaign(start));
  }

  protected override onUnmount(): void {
    this.campaign?.unmount();
  }

  private startCampaign(start: CampaignStart): void {
    const campaign = CampaignControl.create(start, this.context.sounds);

    campaign.onQuit(() => this.quitCampaign());
    campaign.mount(this.view.openStage());
    this.campaign = campaign;
  }

  private quitCampaign(): void {
    this.campaign?.unmount();
    this.campaign = undefined;
    this.view.clearStage();
    this.context.sounds.playMusic('title');
    this.controls.titleScreen.show();
  }
}
