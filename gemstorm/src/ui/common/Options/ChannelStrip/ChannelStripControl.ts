import { Control } from '@/lib/Control';
import type { SoundChannel } from '@/ui/common/sound/SoundChannel';

import { MuteChangedEvent } from '../events/MuteChangedEvent';
import { type ChannelStripContext, ChannelStripView } from './ChannelStripView';
import { VolumeChangedEvent } from './events/VolumeChangedEvent';

export class ChannelStripControl extends Control<ChannelStripView> {
  public constructor(context: ChannelStripContext) {
    super(ChannelStripView, context);
  }

  public showState(): void {
    this.view.showState();
  }

  protected override onMount(): void {
    this.subscribe(MuteChangedEvent, (event) => {
      this.channel.setEnabled(!event.muted);
      this.showState();
    });
    this.subscribe(VolumeChangedEvent, (event) =>
      this.channel.setVolume(event.volume),
    );
    this.showState();
  }

  private get channel(): SoundChannel {
    return this.context.channel;
  }
}
