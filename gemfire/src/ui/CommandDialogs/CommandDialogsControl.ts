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
  private readonly dialogs: ReadonlyMap<string, AnyCommandDialogControl>;

  public constructor(context: CommandDialogsContext) {
    const { world } = context;

    super(CommandDialogsView, context, {
      attackDialog: new AttackDialogControl(AttackCommand.name, world),
      recruitDialog: new RecruitDialogControl(RecruitCommand.name, world),
      moveTroopsDialog: new MoveTroopsDialogControl(
        MoveTroopsCommand.name,
        world,
      ),
      hireMonsterDialog: new HireMonsterDialogControl(
        HireMonsterCommand.name,
        world,
      ),
      developDialog: new DevelopDialogControl(DevelopCommand.name),
      tradeDialog: new TradeDialogControl(TradeCommand.name, world),
      giveFoodDialog: new GiveFoodDialogControl(GiveFoodCommand.name, world),
      transportDialog: new TransportDialogControl(TransportCommand.name, world),
      allyDialog: new AllyDialogControl(AllyCommand.name, world),
      negotiateDialog: new NegotiateDialogControl(NegotiateCommand.name, world),
      sabotageDialog: new InfiltrationDialogControl({
        name: SabotageCommand.name,
        question: 'Sabotage whose land?',
        aim: (target) => `Sabotage ${target}`,
      }),
      plunderDialog: new InfiltrationDialogControl({
        name: PlunderCommand.name,
        question: 'Plunder whose land?',
        aim: (target) => `Plunder ${target}`,
      }),
      familyOverview: new FamilyOverviewControl(ViewCommand.name, world),
      changeLordDialog: new ChangeLordDialogControl(
        ChangeLordCommand.name,
        world,
      ),
      entrustDialog: new EntrustDialogControl(EntrustCommand.name),
      searchDialog: new SearchDialogControl(SearchCommand.name),
    });

    const dialogs = this.controls;

    this.dialogs = new Map<string, AnyCommandDialogControl>([
      [AttackCommand.name, dialogs.attackDialog],
      [RecruitCommand.name, dialogs.recruitDialog],
      [MoveTroopsCommand.name, dialogs.moveTroopsDialog],
      [HireMonsterCommand.name, dialogs.hireMonsterDialog],
      [DevelopCommand.name, dialogs.developDialog],
      [TradeCommand.name, dialogs.tradeDialog],
      [GiveFoodCommand.name, dialogs.giveFoodDialog],
      [TransportCommand.name, dialogs.transportDialog],
      [AllyCommand.name, dialogs.allyDialog],
      [NegotiateCommand.name, dialogs.negotiateDialog],
      [SabotageCommand.name, dialogs.sabotageDialog],
      [PlunderCommand.name, dialogs.plunderDialog],
      [ViewCommand.name, dialogs.familyOverview],
      [ChangeLordCommand.name, dialogs.changeLordDialog],
      [EntrustCommand.name, dialogs.entrustDialog],
      [SearchCommand.name, dialogs.searchDialog],
    ]);
  }

  public get all(): readonly AnyCommandDialogControl[] {
    return [...this.dialogs.values()];
  }

  public findDialog(
    command: WorldCommand,
  ): AnyCommandDialogControl | undefined {
    return this.dialogs.get(command.constructor.name);
  }
}
