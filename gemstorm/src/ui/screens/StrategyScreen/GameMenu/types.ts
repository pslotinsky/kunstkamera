import type { World } from '@/core/domain/World';
import type { GameSaves } from '@/core/saves/GameSaves';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { OptionsControl } from '@/ui/common/Options/OptionsControl';
import type { SaveDetailsControl } from '@/ui/common/SaveDetails/SaveDetailsControl';
import type { SaveSlotsControl } from '@/ui/common/SaveSlots/SaveSlotsControl';
import type { SoundBoard } from '@/ui/common/sound/SoundBoard';

export interface GameMenuContext {
  readonly events: EventBus;
  readonly sounds: SoundBoard;
  readonly world: World;
  readonly saves: GameSaves;
  readonly saveBlockReason: () => string | undefined;
}

export type GameMenuControls = {
  readonly options: OptionsControl;
  readonly saveSlots: SaveSlotsControl;
  readonly saveDetails: SaveDetailsControl;
};

export type GameMenuViews = ChildrenViews<GameMenuControls>;
