import { Control } from '@/lib/Control';

import { ChannelStripControl } from './ChannelStrip/ChannelStripControl';
import { VolumeDragEndedEvent } from './ChannelStrip/events/VolumeDragEndedEvent';
import { MuteChangedEvent } from './events/MuteChangedEvent';
import { OptionsView } from './OptionsView';
import type { OptionsContext, OptionsControls } from './types';

export class OptionsControl extends Control<OptionsView, OptionsControls> {
  public constructor(context: OptionsContext) {
    const { sounds } = context;

    super(OptionsView, context, {
      music: new ChannelStripControl({
        channel: sounds.music,
        name: 'music',
        label: 'Music',
      }),
      sfx: new ChannelStripControl({
        channel: sounds.sfx,
        name: 'sfx',
        label: 'SFX',
      }),
    });
  }

  public show(): void {
    this.view.show();
  }

  protected override onMount(): void {
    const { sounds } = this.context;

    this.subscribe(MuteChangedEvent, (event) => {
      sounds.master.setEnabled(!event.muted);
      this.controls.music.showState();
      this.controls.sfx.showState();
    });
    this.controls.sfx.view.subscribe(VolumeDragEndedEvent, () =>
      sounds.playClick(),
    );
  }
}
