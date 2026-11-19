import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { OptionsControl } from '@/ui/Options/OptionsControl';
import type { SoundBoard } from '@/ui/sound/SoundBoard';

export interface GameMenuContext {
  readonly events: EventBus;
  readonly sounds: SoundBoard;
}

export type GameMenuControls = {
  readonly options: OptionsControl;
};

export type GameMenuViews = ChildrenViews<GameMenuControls>;
