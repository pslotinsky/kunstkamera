import { JudgeCaptiveCommand } from '@/core/commands/JudgeCaptiveCommand';
import type { WorldCommandContext } from '@/core/commands/WorldCommand';
import type { Family } from '@/core/domain/Family';

const BANISH_ODDS = 0.05;

export class CaptorPolicy {
  private readonly context: WorldCommandContext;

  public constructor(context: WorldCommandContext) {
    this.context = context;
  }

  public chooseJudgements(captor: Family): readonly JudgeCaptiveCommand[] {
    return this.context.world.getCaptivesOf(captor).map((captive) => {
      const judgement = new JudgeCaptiveCommand(this.context);

      judgement.judge(
        captive,
        Math.random() < BANISH_ODDS ? 'banish' : 'recruit',
      );

      return judgement;
    });
  }
}
