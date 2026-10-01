import type { CommandGroup } from '@/core/commands/province/catalog';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';

import type { FamilyOverviewControl } from '../FamilyOverview/FamilyOverviewControl';
import type { AllyDialogControl } from './CommandDialog/AllyDialogControl';
import type { AttackDialogControl } from './CommandDialog/AttackDialogControl';
import type { ChangeLordDialogControl } from './CommandDialog/ChangeLordDialogControl';
import type { DevelopDialogControl } from './CommandDialog/DevelopDialogControl';
import type { GiveFoodDialogControl } from './CommandDialog/GiveFoodDialogControl';
import type { HireMonsterDialogControl } from './CommandDialog/HireMonsterDialogControl';
import type { InfiltrationDialogControl } from './CommandDialog/InfiltrationDialogControl';
import type { MoveTroopsDialogControl } from './CommandDialog/MoveTroopsDialogControl';
import type { NegotiateDialogControl } from './CommandDialog/NegotiateDialogControl';
import type { RecruitDialogControl } from './CommandDialog/RecruitDialogControl';
import type { SearchDialogControl } from './CommandDialog/SearchDialogControl';
import type { TradeDialogControl } from './CommandDialog/TradeDialogControl';
import type { TransportDialogControl } from './CommandDialog/TransportDialogControl';

export interface OverlayDialogs {
  readonly hireMonster: HireMonsterDialogControl;
  readonly familyOverview: FamilyOverviewControl;
}

export interface ProvinceCommandsContext {
  readonly world: World;
  readonly commands: readonly CommandGroup[];
  readonly events: EventBus;
}

export type ProvinceCommandsControls = {
  readonly attackDialog: AttackDialogControl;
  readonly developDialog: DevelopDialogControl;
  readonly giveFoodDialog: GiveFoodDialogControl;
  readonly tradeDialog: TradeDialogControl;
  readonly transportDialog: TransportDialogControl;
  readonly recruitDialog: RecruitDialogControl;
  readonly moveTroopsDialog: MoveTroopsDialogControl;
  readonly changeLordDialog: ChangeLordDialogControl;
  readonly searchDialog: SearchDialogControl;
  readonly allyDialog: AllyDialogControl;
  readonly negotiateDialog: NegotiateDialogControl;
  readonly sabotageDialog: InfiltrationDialogControl;
  readonly plunderDialog: InfiltrationDialogControl;
};

export type ProvinceCommandsViews = ChildrenViews<ProvinceCommandsControls>;
