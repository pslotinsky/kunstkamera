import { CommandExecutor } from '@/core/CommandExecutor';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';

import { CaptorPolicy } from './CaptorPolicy';
import { DiplomacyPolicy } from './DiplomacyPolicy';
import { EconomyPolicy } from './EconomyPolicy';
import { WarPolicy } from './WarPolicy';

export class ComputerPlayer {
  private readonly executor: CommandExecutor;
  private readonly context: WorldCommandContext;
  private readonly captor: CaptorPolicy;
  private readonly diplomacy: DiplomacyPolicy;
  private readonly war: WarPolicy;
  private readonly economy: EconomyPolicy;

  public constructor(context: WorldCommandContext) {
    this.executor = new CommandExecutor(context);
    this.context = context;
    this.captor = new CaptorPolicy(context);
    this.diplomacy = new DiplomacyPolicy(context);
    this.war = new WarPolicy(context);
    this.economy = new EconomyPolicy(context);
  }

  public play(province: Province): boolean {
    const { world } = this.context;
    const family = province.family;

    if (
      !family ||
      !world.isComputerRun(province) ||
      !world.campaign.canProgress
    ) {
      return false;
    }

    this.judgeCaptives(family);

    if (!world.campaign.canProgress) {
      return false;
    }

    this.takeFreeActions(province);

    const order = this.chooseOrder(province);

    this.executor.execute(order);

    return order?.suspendsTurn() ?? false;
  }

  private judgeCaptives(family: Family): void {
    if (!family.isEqual(this.context.world.player)) {
      for (const judgement of this.captor.chooseJudgements(family)) {
        this.executor.execute(judgement);
      }
    }
  }

  private takeFreeActions(province: Province): void {
    for (const appointment of this.economy.chooseLords(province)) {
      this.executor.execute(appointment);
    }

    const trade = this.economy.chooseTrade(province);

    this.executor.execute(trade);
  }

  private chooseOrder(province: Province): WorldCommand | undefined {
    return (
      this.diplomacy.chooseCommand(province) ??
      this.war.chooseCommand(province) ??
      this.economy.chooseCommand(province)
    );
  }
}
