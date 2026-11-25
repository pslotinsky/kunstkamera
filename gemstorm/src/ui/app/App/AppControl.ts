import type { SlotNumber } from '@/core/saves/GameSaves';
import type { CampaignStart } from '@/core/WorldFactory';
import { Control } from '@/lib/Control';
import { isDefined } from '@/lib/value/isDefined';
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
      titleScreen: new TitleScreenControl(context),
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
    title.onLoad((slot) => this.loadCampaign(slot));
  }

  protected override onUnmount(): void {
    this.campaign?.unmount();
  }

  private startCampaign(start: CampaignStart): void {
    const { sounds, saves } = this.context;
    const campaign = CampaignControl.create(start, sounds, saves);

    this.mountCampaign(campaign);
  }

  private loadCampaign(slot: SlotNumber): boolean {
    const { sounds, saves } = this.context;
    const world = saves.load(slot);

    if (isDefined(world)) {
      const campaign = CampaignControl.resume(world, sounds, saves);

      this.controls.titleScreen.hide();
      this.mountCampaign(campaign);
    }

    return isDefined(world);
  }

  private mountCampaign(campaign: CampaignControl): void {
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
