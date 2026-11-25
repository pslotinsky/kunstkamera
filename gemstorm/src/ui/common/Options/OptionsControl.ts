import { Control } from '@/lib/Control';
import { SoundSettings } from '@/ui/common/sound/SoundSettings';

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
    const { music, sfx } = this.controls;
    const settings = new SoundSettings(sounds);

    this.subscribe(MuteChangedEvent, (event) => {
      sounds.master.setEnabled(!event.muted);
      music.showState();
      sfx.showState();
      settings.store();
    });
    music.view.subscribe(MuteChangedEvent, () => settings.store());
    music.view.subscribe(VolumeDragEndedEvent, () => settings.store());
    sfx.view.subscribe(MuteChangedEvent, () => settings.store());
    sfx.view.subscribe(VolumeDragEndedEvent, () => {
      sounds.playClick();
      settings.store();
    });
  }
}
