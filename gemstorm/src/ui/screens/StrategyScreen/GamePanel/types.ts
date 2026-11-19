import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { AdviceControl } from '@/ui/screens/StrategyScreen/Advice/AdviceControl';
import type { CommandDialogsControl } from '@/ui/screens/StrategyScreen/CommandDialogs/CommandDialogsControl';
import type { ProvinceCommandsControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/ProvinceCommandsControl';
import type { ProvinceInfoControl } from '@/ui/screens/StrategyScreen/ProvinceInfo/ProvinceInfoControl';

export interface GamePanelContext {
  readonly world: World;
  readonly commands: readonly CommandGroup[];
  readonly events: EventBus;
  readonly dialogs: CommandDialogsControl;
  readonly advice: AdviceControl;
}

export type GamePanelControls = {
  readonly provinceInfo: ProvinceInfoControl;
  readonly provinceCommands: ProvinceCommandsControl;
};

export type GamePanelViews = ChildrenViews<GamePanelControls>;
