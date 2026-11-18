import type { ChildrenViews } from '@/lib/Control';
import type { SoundBoard } from '@/ui/sound/SoundBoard';

import type { ChannelStripControl } from './ChannelStrip/ChannelStripControl';

export interface OptionsContext {
  readonly sounds: SoundBoard;
}

export type OptionsControls = {
  readonly music: ChannelStripControl;
  readonly sfx: ChannelStripControl;
};

export type OptionsViews = ChildrenViews<OptionsControls>;
