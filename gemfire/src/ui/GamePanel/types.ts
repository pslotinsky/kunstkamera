import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { ProvinceInfoControl } from '@/ui/ProvinceInfo/ProvinceInfoControl';

export interface GamePanelContext {
  readonly world: World;
}

export type GamePanelControls = {
  readonly provinceInfo: ProvinceInfoControl;
};

export type GamePanelViews = ChildrenViews<GamePanelControls>;
