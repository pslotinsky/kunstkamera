import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { CampaignStartedEvent } from '@/core/events/CampaignStartedEvent';
import { Control } from '@/lib/Control';
import { BattleScreenControl } from '@/ui/BattleScreen/BattleScreenControl';
import { GameScreenControl } from '@/ui/GameScreen/GameScreenControl';
import { NewGameChosenEvent } from '@/ui/TitleScreen/events/NewGameChosenEvent';
import { TitleScreenControl } from '@/ui/TitleScreen/TitleScreenControl';

import { AppView } from './AppView';
import type { AppContext, AppControls } from './types';

export class AppControl extends Control<AppView, AppControls> {
  public constructor(context: AppContext) {
    super(AppView, context, {
      gameScreen: new GameScreenControl(context),
      battleScreen: new BattleScreenControl({
        world: context.world,
        events: context.events,
        sounds: context.sounds,
      }),
      title: new TitleScreenControl({ sounds: context.sounds }),
    });
  }

  protected override onMount(): void {
    const { events } = this.context;

    this.controls.title.view.subscribe(NewGameChosenEvent, () =>
      this.startCampaign(),
    );
    events.subscribe(
      BattleStartedEvent,
      (event) => this.controls.battleScreen.play(event.battle, event.invasion),
      this.signal,
    );
    events.subscribe(
      BattleEndedEvent,
      () => this.controls.battleScreen.close(),
      this.signal,
    );
  }

  private startCampaign(): void {
    this.controls.title.close();
    this.view.enterCampaign();
    this.context.events.publish(new CampaignStartedEvent());
  }
}
