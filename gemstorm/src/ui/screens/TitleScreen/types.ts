import type { ChildrenViews } from '@/lib/Control';
import type { OptionsControl } from '@/ui/common/Options/OptionsControl';
import type { SoundBoard } from '@/ui/common/sound/SoundBoard';

import type { SceneControl } from './Scene/SceneControl';

export interface TitleScreenContext {
  readonly sounds: SoundBoard;
}

export type TitleScreenControls = {
  readonly scene: SceneControl;
  readonly options: OptionsControl;
};

export type TitleScreenViews = ChildrenViews<TitleScreenControls>;
