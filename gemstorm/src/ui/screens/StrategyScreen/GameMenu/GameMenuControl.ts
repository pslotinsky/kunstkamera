import type { SaveSlot } from '@/core/saves/GameSaves';
import { TurnHold } from '@/core/TurnHold';
import { Control } from '@/lib/Control';
import { isDefined } from '@/lib/value/isDefined';
import { OptionsChosenEvent } from '@/ui/common/Options/events/OptionsChosenEvent';
import { OptionsControl } from '@/ui/common/Options/OptionsControl';
import { SaveDetailsControl } from '@/ui/common/SaveDetails/SaveDetailsControl';
import { SaveSlotsControl } from '@/ui/common/SaveSlots/SaveSlotsControl';

import { MenuBackEvent } from './events/MenuBackEvent';
import { MenuClosedEvent } from './events/MenuClosedEvent';
import { QuitChosenEvent } from './events/QuitChosenEvent';
import { QuitConfirmedEvent } from './events/QuitConfirmedEvent';
import { ReplaceConfirmedEvent } from './events/ReplaceConfirmedEvent';
import { SaveGameChosenEvent } from './events/SaveGameChosenEvent';
import { GameMenuView } from './GameMenuView';
import type { GameMenuContext, GameMenuControls } from './types';

const SAVE_FAILED = 'The game could not be saved.';

export class GameMenuControl extends Control<GameMenuView, GameMenuControls> {
  private readonly turnHold: TurnHold;
  private replacement?: SaveSlot | undefined;

  public constructor(context: GameMenuContext) {
    super(GameMenuView, context, {
      options: new OptionsControl(context),
      saveSlots: new SaveSlotsControl({
        canChoose: ({ status }) => status !== 'unavailable',
      }),
      saveDetails: new SaveDetailsControl(),
    });
    this.turnHold = new TurnHold(context.events, 'pause');
  }

  public open(): void {
    if (!this.view.isOpen) {
      this.replacement = undefined;
      this.turnHold.hold();
      this.view.open(this.context.saveBlockReason());
    }
  }

  public onQuit(handler: () => void): void {
    this.subscribe(QuitConfirmedEvent, handler);
  }

  protected override onMount(): void {
    this.subscribe(OptionsChosenEvent, () => this.controls.options.show());
    this.subscribe(QuitChosenEvent, () => this.view.askToConfirm());
    this.subscribe(MenuClosedEvent, () => this.turnHold.release());
    this.subscribe(SaveGameChosenEvent, () => this.showSlots());
    this.subscribe(ReplaceConfirmedEvent, () => this.replace());
    this.subscribe(MenuBackEvent, () => this.goBack());
    this.controls.saveSlots.onSelect((slot) => this.chooseSlot(slot));
  }

  private showSlots(focused?: SaveSlot): void {
    this.view.showSlots(this.context.saves.list(), focused?.number);
  }

  private chooseSlot(slot: SaveSlot): void {
    if (slot.status === 'empty') {
      this.save(slot);
    } else {
      this.replacement = slot;
      this.view.askToReplace(slot);
    }
  }

  private replace(): void {
    if (isDefined(this.replacement)) {
      this.save(this.replacement);
    }
  }

  private save(slot: SaveSlot): void {
    const { saves, world, saveBlockReason } = this.context;
    const reason = saveBlockReason();

    if (isDefined(reason)) {
      this.view.showSaveMessage(reason);
    } else if (saves.save(slot.number, world)) {
      this.replacement = undefined;
      this.view.finishSave(slot.number);
    } else {
      this.view.showSaveMessage(SAVE_FAILED);
    }
  }

  private goBack(): void {
    switch (this.view.page) {
      case 'replace':
        this.showSlots(this.replacement);
        this.replacement = undefined;
        break;
      case 'slots':
        this.view.showChoices('save');
        break;
      case 'confirm':
        this.view.showChoices('resume');
        break;
      case 'choices':
        break;
    }
  }
}
