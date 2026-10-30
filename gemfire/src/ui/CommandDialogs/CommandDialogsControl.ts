import { AllyCommand } from '@/core/commands/province/AllyCommand';
import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { ChangeLordCommand } from '@/core/commands/province/ChangeLordCommand';
import { DevelopCommand } from '@/core/commands/province/DevelopCommand';
import { EntrustCommand } from '@/core/commands/province/EntrustCommand';
import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import { HireMonsterCommand } from '@/core/commands/province/HireMonsterCommand';
import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import { NegotiateCommand } from '@/core/commands/province/NegotiateCommand';
import { PlunderCommand } from '@/core/commands/province/PlunderCommand';
import { RecruitCommand } from '@/core/commands/province/RecruitCommand';
import { SabotageCommand } from '@/core/commands/province/SabotageCommand';
import { SearchCommand } from '@/core/commands/province/SearchCommand';
import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { TransportCommand } from '@/core/commands/province/TransportCommand';
import { ViewCommand } from '@/core/commands/province/ViewCommand';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import { Control } from '@/lib/Control';
import { FamilyOverviewControl } from '@/ui/FamilyOverview/FamilyOverviewControl';
import { AllyDialogControl } from '@/ui/ProvinceCommands/CommandDialog/AllyDialogControl';
import { AttackDialogControl } from '@/ui/ProvinceCommands/CommandDialog/AttackDialogControl';
import { ChangeLordDialogControl } from '@/ui/ProvinceCommands/CommandDialog/ChangeLordDialogControl';
import type { AnyCommandDialogControl } from '@/ui/ProvinceCommands/CommandDialog/CommandDialogControl';
import { DevelopDialogControl } from '@/ui/ProvinceCommands/CommandDialog/DevelopDialogControl';
import { EntrustDialogControl } from '@/ui/ProvinceCommands/CommandDialog/EntrustDialogControl';
import { GiveFoodDialogControl } from '@/ui/ProvinceCommands/CommandDialog/GiveFoodDialogControl';
import { HireMonsterDialogControl } from '@/ui/ProvinceCommands/CommandDialog/HireMonsterDialogControl';
import { InfiltrationDialogControl } from '@/ui/ProvinceCommands/CommandDialog/InfiltrationDialogControl';
import { MoveTroopsDialogControl } from '@/ui/ProvinceCommands/CommandDialog/MoveTroopsDialogControl';
import { NegotiateDialogControl } from '@/ui/ProvinceCommands/CommandDialog/NegotiateDialogControl';
import { RecruitDialogControl } from '@/ui/ProvinceCommands/CommandDialog/RecruitDialogControl';
import { SearchDialogControl } from '@/ui/ProvinceCommands/CommandDialog/SearchDialogControl';
import { TradeDialogControl } from '@/ui/ProvinceCommands/CommandDialog/TradeDialogControl';
import { TransportDialogControl } from '@/ui/ProvinceCommands/CommandDialog/TransportDialogControl';

import { CommandDialogsView } from './CommandDialogsView';
import type { CommandDialogsContext, CommandDialogsControls } from './types';

export class CommandDialogsControl extends Control<
  CommandDialogsView,
  CommandDialogsControls
> {
  private readonly dialogs: ReadonlyMap<object, AnyCommandDialogControl>;

  public constructor(context: CommandDialogsContext) {
    const { world } = context;

    super(CommandDialogsView, context, {
      attackDialog: new AttackDialogControl('attack', world),
      recruitDialog: new RecruitDialogControl('recruit', world),
      moveTroopsDialog: new MoveTroopsDialogControl('move-troops', world),
      hireMonsterDialog: new HireMonsterDialogControl('hire-monster', world),
      developDialog: new DevelopDialogControl('develop'),
      tradeDialog: new TradeDialogControl('trade', world),
      giveFoodDialog: new GiveFoodDialogControl('give-food', world),
      transportDialog: new TransportDialogControl('transport', world),
      allyDialog: new AllyDialogControl('ally', world),
      negotiateDialog: new NegotiateDialogControl('negotiate', world),
      sabotageDialog: new InfiltrationDialogControl({
        name: 'sabotage',
        question: 'Sabotage whose land?',
        aim: (target) => `Sabotage ${target}`,
      }),
      plunderDialog: new InfiltrationDialogControl({
        name: 'plunder',
        question: 'Plunder whose land?',
        aim: (target) => `Plunder ${target}`,
      }),
      familyOverview: new FamilyOverviewControl('view', world),
      changeLordDialog: new ChangeLordDialogControl('change-lord', world),
      entrustDialog: new EntrustDialogControl('entrust'),
      searchDialog: new SearchDialogControl('search'),
    });

    const dialogs = this.controls;

    this.dialogs = new Map<object, AnyCommandDialogControl>([
      [AttackCommand, dialogs.attackDialog],
      [RecruitCommand, dialogs.recruitDialog],
      [MoveTroopsCommand, dialogs.moveTroopsDialog],
      [HireMonsterCommand, dialogs.hireMonsterDialog],
      [DevelopCommand, dialogs.developDialog],
      [TradeCommand, dialogs.tradeDialog],
      [GiveFoodCommand, dialogs.giveFoodDialog],
      [TransportCommand, dialogs.transportDialog],
      [AllyCommand, dialogs.allyDialog],
      [NegotiateCommand, dialogs.negotiateDialog],
      [SabotageCommand, dialogs.sabotageDialog],
      [PlunderCommand, dialogs.plunderDialog],
      [ViewCommand, dialogs.familyOverview],
      [ChangeLordCommand, dialogs.changeLordDialog],
      [EntrustCommand, dialogs.entrustDialog],
      [SearchCommand, dialogs.searchDialog],
    ]);
  }

  public get all(): readonly AnyCommandDialogControl[] {
    return [...this.dialogs.values()];
  }

  public findDialog(
    command: WorldCommand,
  ): AnyCommandDialogControl | undefined {
    return this.dialogs.get(command.constructor);
  }
}
