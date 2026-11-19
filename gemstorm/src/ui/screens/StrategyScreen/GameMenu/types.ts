import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { OptionsControl } from '@/ui/common/Options/OptionsControl';
import type { SoundBoard } from '@/ui/common/sound/SoundBoard';

export interface GameMenuContext {
  readonly events: EventBus;
  readonly sounds: SoundBoard;
}

export type GameMenuControls = {
  readonly options: OptionsControl;
};

export type GameMenuViews = ChildrenViews<GameMenuControls>;
