import { Control } from '@/lib/Control';
import { OptionsChosenEvent } from '@/ui/Options/events/OptionsChosenEvent';
import { OptionsControl } from '@/ui/Options/OptionsControl';
import { TurnHold } from '@/ui/TurnHold';

import { MenuClosedEvent } from './events/MenuClosedEvent';
import { QuitChosenEvent } from './events/QuitChosenEvent';
import { QuitConfirmedEvent } from './events/QuitConfirmedEvent';
import { GameMenuView } from './GameMenuView';
import type { GameMenuContext, GameMenuControls } from './types';

export class GameMenuControl extends Control<GameMenuView, GameMenuControls> {
  private readonly turnHold: TurnHold;

  public constructor(context: GameMenuContext) {
    super(GameMenuView, context, {
      options: new OptionsControl(context),
    });
    this.turnHold = new TurnHold(context.events);
  }

  public open(): void {
    if (!this.view.isOpen) {
      this.turnHold.hold();
      this.view.open();
    }
  }

  public onQuit(handler: () => void): void {
    this.subscribe(QuitConfirmedEvent, handler);
  }

  protected override onMount(): void {
    this.subscribe(OptionsChosenEvent, () => this.controls.options.show());
    this.subscribe(QuitChosenEvent, () => this.view.askToConfirm());
    this.subscribe(MenuClosedEvent, () => this.turnHold.release());
  }
}
