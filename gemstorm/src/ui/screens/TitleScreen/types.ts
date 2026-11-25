import type { GameSaves } from '@/core/saves/GameSaves';
import type { ChildrenViews } from '@/lib/Control';
import type { OptionsControl } from '@/ui/common/Options/OptionsControl';
import type { SaveDetailsControl } from '@/ui/common/SaveDetails/SaveDetailsControl';
import type { SaveSlotsControl } from '@/ui/common/SaveSlots/SaveSlotsControl';
import type { SoundBoard } from '@/ui/common/sound/SoundBoard';

import type { SceneControl } from './Scene/SceneControl';

export interface TitleScreenContext {
  readonly sounds: SoundBoard;
  readonly saves: GameSaves;
}

export type TitleScreenControls = {
  readonly scene: SceneControl;
  readonly options: OptionsControl;
  readonly saveSlots: SaveSlotsControl;
  readonly saveDetails: SaveDetailsControl;
};

export type TitleScreenViews = ChildrenViews<TitleScreenControls>;
