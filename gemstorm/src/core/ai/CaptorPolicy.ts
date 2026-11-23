import { JudgeCaptiveCommand } from '@/core/commands/JudgeCaptiveCommand';
import { RansomCommand } from '@/core/commands/RansomCommand';
import type { WorldCommandContext } from '@/core/commands/WorldCommand';
import type { Captive } from '@/core/domain/Captive';
import { Captivity, type Disposal } from '@/core/domain/Captivity';
import type { Family } from '@/core/domain/Family';

const CHARISMA_BANISH_LIMIT = 100;
const BANISH_CHANCE_DIVISOR = 3;
const PERCENT_SCALE = 100;
const GOLD_DEMAND_CHANCE = 0.5;

export class CaptorPolicy {
  private readonly context: WorldCommandContext;
  private readonly captivity: Captivity;

  public constructor(context: WorldCommandContext) {
    this.context = context;
    this.captivity = new Captivity(context.world);
  }

  public chooseJudgement(captive: Captive): JudgeCaptiveCommand {
    const judgement = new JudgeCaptiveCommand(this.context);

    judgement.judge(captive, this.chooseDisposal(captive));

    return judgement;
  }

  public demandRansom(captive: Captive): RansomCommand {
    const command = new RansomCommand(this.context);
    const currency = Math.random() < GOLD_DEMAND_CHANCE ? 'gold' : 'food';

    command.demand(captive, currency);

    return command;
  }

  private chooseDisposal(captive: Captive): Disposal {
    let disposal: Disposal = 'release';

    if (this.captivity.canRecruit(captive)) {
      disposal = 'recruit';
    } else if (this.shouldBanish(captive.captor)) {
      disposal = 'banish';
    }

    return disposal;
  }

  private shouldBanish(captor: Family): boolean {
    const { charisma } = captor.ruler.stats;
    const deficit = CHARISMA_BANISH_LIMIT - charisma;
    const chance = deficit / BANISH_CHANCE_DIVISOR / PERCENT_SCALE;

    return chance > 0 && Math.random() < chance;
  }
}
