import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { GamePanelControl } from '@/ui/GamePanel/GamePanelControl';
import type { WorldMapControl } from '@/ui/WorldMap/WorldMapControl';

export interface GameScreenContext {
  readonly world: World;
}

export type GameScreenControls = {
  readonly worldMap: WorldMapControl;
  readonly gamePanel: GamePanelControl;
};

export type GameScreenViews = ChildrenViews<GameScreenControls>;
