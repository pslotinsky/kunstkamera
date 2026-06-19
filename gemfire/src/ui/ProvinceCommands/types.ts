import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';

import type { ChangeLordDialogControl } from './CommandDialog/ChangeLordDialogControl';
import type { DevelopDialogControl } from './CommandDialog/DevelopDialogControl';
import type { GiveFoodDialogControl } from './CommandDialog/GiveFoodDialogControl';
import type { RecruitDialogControl } from './CommandDialog/RecruitDialogControl';
import type { TradeDialogControl } from './CommandDialog/TradeDialogControl';
import type { TransportDialogControl } from './CommandDialog/TransportDialogControl';

export interface ProvinceCommandsContext {
  readonly world: World;
  readonly commands: readonly CommandGroup[];
  readonly events: EventBus;
}

export type ProvinceCommandsControls = {
  readonly developDialog: DevelopDialogControl;
  readonly giveFoodDialog: GiveFoodDialogControl;
  readonly tradeDialog: TradeDialogControl;
  readonly transportDialog: TransportDialogControl;
  readonly recruitDialog: RecruitDialogControl;
  readonly changeLordDialog: ChangeLordDialogControl;
};

export type ProvinceCommandsViews = ChildrenViews<ProvinceCommandsControls>;
