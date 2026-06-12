import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { GamePanelControl } from '@/ui/GamePanel/GamePanelControl';
import type { WorldMapControl } from '@/ui/WorldMap/WorldMapControl';

export interface GameScreenContext {
  readonly world: World;
  readonly events: EventBus;
  readonly commands: readonly CommandGroup[];
}

export type GameScreenControls = {
  readonly worldMap: WorldMapControl;
  readonly gamePanel: GamePanelControl;
};

export type GameScreenViews = ChildrenViews<GameScreenControls>;
