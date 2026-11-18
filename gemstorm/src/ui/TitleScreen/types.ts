import type { ChildrenViews } from '@/lib/Control';
import type { OptionsControl } from '@/ui/Options/OptionsControl';
import type { SoundBoard } from '@/ui/sound/SoundBoard';

import type { SceneControl } from './Scene/SceneControl';

export interface TitleScreenContext {
  readonly sounds: SoundBoard;
}

export type TitleScreenControls = {
  readonly scene: SceneControl;
  readonly options: OptionsControl;
};

export type TitleScreenViews = ChildrenViews<TitleScreenControls>;
