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
  private readonly context: WorldCommandContext;
  private readonly captor: CaptorPolicy;
  private readonly diplomacy: DiplomacyPolicy;
  private readonly war: WarPolicy;
  private readonly economy: EconomyPolicy;

  public constructor(context: WorldCommandContext) {
    this.context = context;
    this.captor = new CaptorPolicy(context);
    this.diplomacy = new DiplomacyPolicy(context);
    this.war = new WarPolicy(context);
    this.economy = new EconomyPolicy(context);
  }

  public play(province: Province): boolean {
    const family = province.family;
    let suspended = false;

    if (family && this.context.world.isComputerRun(province)) {
      this.judgeCaptives(family);
      this.takeFreeActions(province);

      const order = this.chooseOrder(province);

      order?.execute();
      suspended = order?.suspendsTurn() ?? false;
    }

    return suspended;
  }

  private judgeCaptives(family: Family): void {
    if (!family.isEqual(this.context.world.player)) {
      for (const judgement of this.captor.chooseJudgements(family)) {
        judgement.execute();
      }
    }
  }

  private takeFreeActions(province: Province): void {
    for (const appointment of this.economy.chooseLords(province)) {
      appointment.execute();
    }

    this.economy.chooseTrade(province)?.execute();
  }

  private chooseOrder(province: Province): WorldCommand | undefined {
    return (
      this.diplomacy.chooseCommand(province) ??
      this.war.chooseCommand(province) ??
      this.economy.chooseCommand(province)
    );
  }
}
