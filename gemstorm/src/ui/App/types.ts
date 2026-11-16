import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { BattleScreenControl } from '@/ui/BattleScreen/BattleScreenControl';
import type { GameScreenControl } from '@/ui/GameScreen/GameScreenControl';
import type { SoundBoard } from '@/ui/sound/SoundBoard';

export interface AppContext {
  readonly world: World;
  readonly events: EventBus;
  readonly commands: readonly CommandGroup[];
  readonly sounds: SoundBoard;
}

export type AppControls = {
  readonly gameScreen: GameScreenControl;
  readonly battleScreen: BattleScreenControl;
};

export type AppViews = ChildrenViews<AppControls>;
