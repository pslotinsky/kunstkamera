import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { ProvinceCommandsControl } from '@/ui/ProvinceCommands/ProvinceCommandsControl';
import type { ProvinceInfoControl } from '@/ui/ProvinceInfo/ProvinceInfoControl';

export interface GamePanelContext {
  readonly world: World;
  readonly commands: readonly CommandGroup[];
  readonly events: EventBus;
}

export type GamePanelControls = {
  readonly provinceInfo: ProvinceInfoControl;
  readonly provinceCommands: ProvinceCommandsControl;
};

export type GamePanelViews = ChildrenViews<GamePanelControls>;
