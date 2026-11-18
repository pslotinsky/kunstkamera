import { Control } from '@/lib/Control';
import { OptionsClosedEvent } from '@/ui/Options/events/OptionsClosedEvent';
import { OptionsControl } from '@/ui/Options/OptionsControl';

import { OptionsChosenEvent } from './events/OptionsChosenEvent';
import { SceneControl } from './Scene/SceneControl';
import { TitleScreenView } from './TitleScreenView';
import type { TitleScreenContext, TitleScreenControls } from './types';

export class TitleScreenControl extends Control<
  TitleScreenView,
  TitleScreenControls
> {
  public constructor(context: TitleScreenContext) {
    super(TitleScreenView, context, {
      scene: new SceneControl(),
      options: new OptionsControl(context),
    });
  }

  public close(): void {
    this.controls.scene.setPaused(true);
    this.view.hide();
  }

  protected override onMount(): void {
    this.subscribe(OptionsChosenEvent, () => this.openOptions());
    this.controls.options.view.subscribe(OptionsClosedEvent, () =>
      this.controls.scene.setPaused(false),
    );
  }

  private openOptions(): void {
    this.controls.scene.setPaused(true);
    this.controls.options.show();
  }
}
