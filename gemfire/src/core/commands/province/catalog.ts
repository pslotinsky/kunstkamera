import type { WorldCommand, WorldCommandContext } from '../WorldCommand';
import { AllyCommand } from './AllyCommand';
import { AttackCommand } from './AttackCommand';
import { ChangeLordCommand } from './ChangeLordCommand';
import { DevelopCommand } from './DevelopCommand';
import { EntrustCommand } from './EntrustCommand';
import { GiveFoodCommand } from './GiveFoodCommand';
import { HireMonsterCommand } from './HireMonsterCommand';
import { MoveTroopsCommand } from './MoveTroopsCommand';
import { NegotiateCommand } from './NegotiateCommand';
import { RecruitCommand } from './RecruitCommand';
import { SearchCommand } from './SearchCommand';
import { TradeCommand } from './TradeCommand';
import { TransportCommand } from './TransportCommand';
import { ViewCommand } from './ViewCommand';

export type CommandGroupTitle =
  | 'Military'
  | 'Domestic'
  | 'Diplomacy'
  | 'Vassal';

export interface CommandGroup {
  readonly title: CommandGroupTitle;
  readonly commands: readonly WorldCommand[];
}

export function createCommandGroups(
  context: WorldCommandContext,
): readonly CommandGroup[] {
  return [
    {
      title: 'Military',
      commands: [
        new AttackCommand(context),
        new RecruitCommand(context),
        new MoveTroopsCommand(context),
        new HireMonsterCommand(context),
      ],
    },
    {
      title: 'Domestic',
      commands: [
        new DevelopCommand(context),
        new TradeCommand(context),
        new GiveFoodCommand(context),
        new TransportCommand(context),
      ],
    },
    {
      title: 'Diplomacy',
      commands: [new AllyCommand(context), new NegotiateCommand(context)],
    },
    {
      title: 'Vassal',
      commands: [
        new ViewCommand(context),
        new ChangeLordCommand(context),
        new EntrustCommand(context),
        new SearchCommand(context),
      ],
    },
  ];
}
