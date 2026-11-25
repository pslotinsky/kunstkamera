import type { GameSaves } from '@/core/saves/GameSaves';
import type { ChildrenViews } from '@/lib/Control';
import type { SoundBoard } from '@/ui/common/sound/SoundBoard';
import type { NewGameScreenControl } from '@/ui/screens/NewGameScreen/NewGameScreenControl';
import type { TitleScreenControl } from '@/ui/screens/TitleScreen/TitleScreenControl';

export interface AppContext {
  readonly sounds: SoundBoard;
  readonly saves: GameSaves;
}

export type AppControls = {
  readonly titleScreen: TitleScreenControl;
  readonly newStrategyScreen: NewGameScreenControl;
};

export type AppViews = ChildrenViews<AppControls>;
