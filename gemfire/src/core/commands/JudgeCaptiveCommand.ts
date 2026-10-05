import type { Captive } from '@/core/domain/Captive';
import {
  Captivity,
  type Disposal,
  type DisposalOutcome,
} from '@/core/domain/Captivity';
import { CaptiveJudgedEvent } from '@/core/events/CaptiveJudgedEvent';
import { SuccessionReportedEvent } from '@/core/events/SuccessionReportedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export class JudgeCaptiveCommand extends WorldCommand {
  public outcome: DisposalOutcome | undefined;

  private readonly captivity: Captivity;

  private captive: Captive | undefined;
  private disposal: Disposal = 'release';

  public constructor(context: WorldCommandContext) {
    super('Judge Captive', context);
    this.captivity = new Captivity(context.world);
  }

  public judge(captive: Captive, disposal: Disposal): void {
    this.captive = captive;
    this.disposal = disposal;
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {
    const captive = this.captive;

    if (captive) {
      const provinces = this.context.world.getFamilyProvinces(captive.house);
      const outcome = this.carryOut(captive);

      this.outcome = outcome;
      this.context.world.free(captive);
      this.publishUpdates(provinces);
    }
  }

  private carryOut(captive: Captive): DisposalOutcome {
    if (this.disposal === 'recruit') {
      return this.recruit(captive);
    }

    if (this.disposal === 'release') {
      this.captivity.release(captive);
      this.publish(new CaptiveJudgedEvent(captive, 'released'));

      return 'released';
    }

    this.banish(captive);

    return 'banished';
  }

  private recruit(captive: Captive): DisposalOutcome {
    const outcome = this.captivity.recruit(captive) ? 'joined' : 'refused';

    this.publish(new CaptiveJudgedEvent(captive, outcome));

    return outcome;
  }

  private banish(captive: Captive): void {
    const outcome = this.captivity.banish(captive);

    if (outcome) {
      this.publish(new SuccessionReportedEvent(outcome, 'banishment'));
      this.publishUpdates(outcome.provinces);
    } else {
      this.publish(new CaptiveJudgedEvent(captive, 'banished'));
    }
  }
}
