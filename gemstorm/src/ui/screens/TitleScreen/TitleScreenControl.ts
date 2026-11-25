import type { SaveSlot, SlotNumber } from '@/core/saves/GameSaves';
import { Control } from '@/lib/Control';
import { isDefined } from '@/lib/value/isDefined';
import { OptionsChosenEvent } from '@/ui/common/Options/events/OptionsChosenEvent';
import { OptionsClosedEvent } from '@/ui/common/Options/events/OptionsClosedEvent';
import { OptionsControl } from '@/ui/common/Options/OptionsControl';
import { SaveDetailsControl } from '@/ui/common/SaveDetails/SaveDetailsControl';
import { SaveSlotsControl } from '@/ui/common/SaveSlots/SaveSlotsControl';

import { ContinueChosenEvent } from './events/ContinueChosenEvent';
import { LoadConfirmedEvent } from './events/LoadConfirmedEvent';
import { LoadGameChosenEvent } from './events/LoadGameChosenEvent';
import { LoadPickerClosedEvent } from './events/LoadPickerClosedEvent';
import { SceneControl } from './Scene/SceneControl';
import { TitleScreenView } from './TitleScreenView';
import type { TitleScreenContext, TitleScreenControls } from './types';

const LOAD_FAILED = 'This saved game could not be loaded.';

type LoadCampaign = (slot: SlotNumber) => boolean;

export class TitleScreenControl extends Control<
  TitleScreenView,
  TitleScreenControls
> {
  private slots: readonly SaveSlot[] = [];
  private selected?: SlotNumber | undefined;
  private loadCampaign: LoadCampaign = () => false;

  public constructor(context: TitleScreenContext) {
    super(TitleScreenView, context, {
      scene: new SceneControl(),
      options: new OptionsControl(context),
      saveSlots: new SaveSlotsControl({
        canChoose: ({ status }) => status === 'ready',
      }),
      saveDetails: new SaveDetailsControl(),
    });
  }

  public onLoad(handler: LoadCampaign): void {
    this.loadCampaign = handler;
  }

  public show(): void {
    this.view.show();
    this.refreshSaves();
    this.view.focusMainMenu();
    this.controls.scene.setPaused(false);
  }

  public hide(): void {
    this.controls.scene.setPaused(true);
    this.view.hide();
  }

  protected override onMount(): void {
    this.subscribe(OptionsChosenEvent, () => this.openOptions());
    this.controls.options.view.subscribe(OptionsClosedEvent, () =>
      this.controls.scene.setPaused(false),
    );
    this.subscribe(ContinueChosenEvent, () => this.continueCampaign());
    this.subscribe(LoadGameChosenEvent, () => this.openLoadPicker());
    this.subscribe(LoadConfirmedEvent, () => this.loadSelected());
    this.subscribe(LoadPickerClosedEvent, () => this.resumeScene());
    this.controls.saveSlots.onSelect(({ number }) => this.select(number));
    window.addEventListener('storage', () => this.refreshWhileVisible(), {
      signal: this.signal,
    });
    this.refreshSaves();
    this.view.focusMainMenu();
  }

  private openOptions(): void {
    this.controls.scene.setPaused(true);
    this.controls.options.show();
  }

  private resumeScene(): void {
    if (this.view.isVisible) {
      this.controls.scene.setPaused(false);
    }
  }

  private refreshWhileVisible(): void {
    if (this.view.isVisible) {
      this.refreshSaves();
    }
  }

  private refreshSaves(): void {
    const { saves } = this.context;

    this.slots = saves.list();
    this.view.showSaves(this.slots, saves.newest(this.slots)?.summary);
  }

  private continueCampaign(): void {
    const newest = this.context.saves.newest(this.slots);
    const isLoaded = isDefined(newest) && this.loadCampaign(newest.number);

    if (!isLoaded) {
      this.refreshSaves();
      this.view.showTitleMessage(LOAD_FAILED);
    }
  }

  private openLoadPicker(): void {
    this.refreshSaves();
    this.selected = this.context.saves.newest(this.slots)?.number;
    this.controls.scene.setPaused(true);
    this.view.showLoadPicker(this.slots, this.selected);
  }

  private select(number: SlotNumber): void {
    this.selected = number;
    this.view.updateLoadPicker(this.slots, number);
  }

  private loadSelected(): void {
    const isLoaded =
      isDefined(this.selected) && this.loadCampaign(this.selected);

    if (isLoaded) {
      this.view.closeLoadPicker();
    } else {
      this.refreshSaves();
      this.view.updateLoadPicker(this.slots, this.selected);
      this.view.showLoadMessage(LOAD_FAILED);
    }
  }
}
