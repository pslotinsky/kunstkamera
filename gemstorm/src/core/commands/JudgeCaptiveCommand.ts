import type { Captive } from '@/core/domain/Captive';
import {
  Captivity,
  type Disposal,
  type DisposalOutcome,
} from '@/core/domain/Captivity';
import { CaptiveJudgedEvent } from '@/core/events/CaptiveJudgedEvent';
import { SuccessionReportedEvent } from '@/core/events/SuccessionReportedEvent';
import { isDefined } from '@/lib/value/isDefined';

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
    this.outcome = undefined;
  }

  public canRecruit(captive: Captive): boolean {
    return this.captivity.canRecruit(captive);
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {
    const captive = this.captive;
    const { world } = this.context;

    if (
      isDefined(captive) &&
      world.hasCaptive(captive) &&
      !isDefined(captive.ransom)
    ) {
      const provinces = world.getFamilyProvinces(captive.house);
      const outcome = this.carryOut(captive);

      if (isDefined(outcome)) {
        this.outcome = outcome;
        world.free(captive);
        this.publishUpdates(provinces);
        this.publishVassalOffer();
      }
    }
  }

  private carryOut(captive: Captive): DisposalOutcome | undefined {
    switch (this.disposal) {
      case 'recruit':
        return this.recruit(captive);
      case 'release':
        return this.release(captive);
      case 'banish':
        return this.banish(captive);
    }
  }

  private recruit(captive: Captive): DisposalOutcome | undefined {
    const recruited = this.captivity.recruit(captive);

    if (recruited) {
      this.publish(new CaptiveJudgedEvent(captive, 'joined'));
    }

    return recruited ? 'joined' : undefined;
  }

  private release(captive: Captive): 'released' {
    const destination = this.captivity.release(captive);

    if (isDefined(destination)) {
      this.publishUpdates([destination]);
    }
    this.publish(new CaptiveJudgedEvent(captive, 'released'));

    return 'released';
  }

  private banish(captive: Captive): 'banished' {
    const outcome = this.captivity.banish(captive);

    if (outcome) {
      this.publish(new SuccessionReportedEvent(outcome, 'banishment'));
      this.publishUpdates(outcome.provinces);
    } else {
      this.publish(new CaptiveJudgedEvent(captive, 'banished'));
    }

    return 'banished';
  }
}
