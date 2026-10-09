import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { FamilyOverviewControl } from '@/ui/FamilyOverview/FamilyOverviewControl';
import type { AllyDialogControl } from '@/ui/ProvinceCommands/CommandDialog/AllyDialogControl';
import type { AttackDialogControl } from '@/ui/ProvinceCommands/CommandDialog/AttackDialogControl';
import type { ChangeLordDialogControl } from '@/ui/ProvinceCommands/CommandDialog/ChangeLordDialogControl';
import type { DevelopDialogControl } from '@/ui/ProvinceCommands/CommandDialog/DevelopDialogControl';
import type { EntrustDialogControl } from '@/ui/ProvinceCommands/CommandDialog/EntrustDialogControl';
import type { GiveFoodDialogControl } from '@/ui/ProvinceCommands/CommandDialog/GiveFoodDialogControl';
import type { HireMonsterDialogControl } from '@/ui/ProvinceCommands/CommandDialog/HireMonsterDialogControl';
import type { InfiltrationDialogControl } from '@/ui/ProvinceCommands/CommandDialog/InfiltrationDialogControl';
import type { MoveTroopsDialogControl } from '@/ui/ProvinceCommands/CommandDialog/MoveTroopsDialogControl';
import type { NegotiateDialogControl } from '@/ui/ProvinceCommands/CommandDialog/NegotiateDialogControl';
import type { RecruitDialogControl } from '@/ui/ProvinceCommands/CommandDialog/RecruitDialogControl';
import type { SearchDialogControl } from '@/ui/ProvinceCommands/CommandDialog/SearchDialogControl';
import type { TradeDialogControl } from '@/ui/ProvinceCommands/CommandDialog/TradeDialogControl';
import type { TransportDialogControl } from '@/ui/ProvinceCommands/CommandDialog/TransportDialogControl';

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
