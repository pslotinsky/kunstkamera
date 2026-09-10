import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { Control } from '@/lib/Control';
import { BattleScreenControl } from '@/ui/BattleScreen/BattleScreenControl';
import { GameScreenControl } from '@/ui/GameScreen/GameScreenControl';

import { AppView } from './AppView';
import type { AppContext, AppControls } from './types';

export class AppControl extends Control<AppView, AppControls> {
  public constructor(context: AppContext) {
    super(AppView, context, {
      gameScreen: new GameScreenControl(context),
      battleScreen: new BattleScreenControl({
        world: context.world,
        events: context.events,
      }),
    });
  }

  protected override onMount(): void {
    const { events } = this.context;

    events.subscribe(
      BattleStartedEvent,
      (event) => this.controls.battleScreen.play(event.battle),
      this.signal,
    );
    events.subscribe(
      BattleEndedEvent,
      () => this.controls.battleScreen.close(),
      this.signal,
    );
  }
}
