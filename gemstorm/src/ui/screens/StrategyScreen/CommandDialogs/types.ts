import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { FamilyOverviewControl } from '@/ui/screens/StrategyScreen/FamilyOverview/FamilyOverviewControl';
import type { AllyDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/AllyDialogControl';
import type { AttackDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/AttackDialogControl';
import type { ChangeLordDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/ChangeLordDialogControl';
import type { DevelopDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/DevelopDialogControl';
import type { EntrustDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/EntrustDialogControl';
import type { GiveFoodDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/GiveFoodDialogControl';
import type { HireMonsterDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/HireMonsterDialogControl';
import type { InfiltrationDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/InfiltrationDialogControl';
import type { MoveTroopsDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/MoveTroopsDialogControl';
import type { NegotiateDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/NegotiateDialogControl';
import type { RecruitDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/RecruitDialogControl';
import type { SearchDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/SearchDialogControl';
import type { TradeDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/TradeDialogControl';
import type { TransportDialogControl } from '@/ui/screens/StrategyScreen/ProvinceCommands/CommandDialog/TransportDialogControl';

export interface CommandDialogsContext {
  readonly world: World;
}

export type CommandDialogsControls = {
  readonly attackDialog: AttackDialogControl;
  readonly recruitDialog: RecruitDialogControl;
  readonly moveTroopsDialog: MoveTroopsDialogControl;
  readonly hireMonsterDialog: HireMonsterDialogControl;
  readonly developDialog: DevelopDialogControl;
  readonly tradeDialog: TradeDialogControl;
  readonly giveFoodDialog: GiveFoodDialogControl;
  readonly transportDialog: TransportDialogControl;
  readonly allyDialog: AllyDialogControl;
  readonly negotiateDialog: NegotiateDialogControl;
  readonly sabotageDialog: InfiltrationDialogControl;
  readonly plunderDialog: InfiltrationDialogControl;
  readonly familyOverview: FamilyOverviewControl;
  readonly changeLordDialog: ChangeLordDialogControl;
  readonly entrustDialog: EntrustDialogControl;
  readonly searchDialog: SearchDialogControl;
};

export type CommandDialogsViews = ChildrenViews<CommandDialogsControls>;
