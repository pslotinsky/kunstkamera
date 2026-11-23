import type { Captive } from '@/core/domain/Captive';
import { Captivity } from '@/core/domain/Captivity';
import type { Ransom, RansomCurrency } from '@/core/domain/Ransom';
import { CaptiveJudgedEvent } from '@/core/events/CaptiveJudgedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

type RansomDemand = {
  readonly kind: 'demand';
  readonly captive: Captive;
  readonly currency: RansomCurrency;
};

type RansomAnswer = {
  readonly kind: 'answer';
  readonly captive: Captive;
  readonly accepted: boolean;
};

export class RansomCommand extends WorldCommand {
  public outcome: 'paid' | 'declined' | undefined;

  private readonly captivity: Captivity;
  private action: RansomDemand | RansomAnswer | undefined;

  public constructor(context: WorldCommandContext) {
    super('Ransom', context);
    this.captivity = new Captivity(context.world);
  }

  public demand(captive: Captive, currency: RansomCurrency): void {
    this.action = { kind: 'demand', captive, currency };
    this.outcome = undefined;
  }

  public answer(captive: Captive, accepted: boolean): void {
    this.action = { kind: 'answer', captive, accepted };
    this.outcome = undefined;
  }

  public canPay(captive: Captive): boolean {
    const { house, demand, ransom } = captive;
    const home = house.homeProvince;

    return (
      isDefined(demand) &&
      isDefined(ransom) &&
      home.belongsTo(house) &&
      ransom.canPay(demand, home)
    );
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {
    const { action } = this;

    if (isDefined(action) && this.context.world.hasCaptive(action.captive)) {
      if (action.kind === 'demand') {
        this.makeDemand(action.captive, action.currency);
      } else {
        this.settle(action.captive, action.accepted);
      }
    }
  }

  private makeDemand(captive: Captive, currency: RansomCurrency): void {
    const { house, ransom } = captive;

    if (isDefined(ransom) && captive.canDemandRansom) {
      captive.demandRansom(currency);

      if (!house.isEqual(this.context.world.player)) {
        const home = house.homeProvince;
        const accepted =
          home.belongsTo(house) && ransom.willPay(currency, home);

        this.settle(captive, accepted);
      }
    }
  }

  private settle(captive: Captive, accepted: boolean): void {
    const { demand, ransom } = captive;

    if (isDefined(demand) && isDefined(ransom)) {
      if (accepted && this.canPay(captive)) {
        this.collect(captive, ransom, demand);
      } else if (!accepted) {
        captive.closeRansom();
        this.outcome = 'declined';
      }
    }
  }

  private collect(
    captive: Captive,
    ransom: Ransom,
    currency: RansomCurrency,
  ): void {
    const { world } = this.context;
    const { battlefield, house } = captive;
    const home = house.homeProvince;

    ransom.pay(currency, home, battlefield);
    const vacated = this.captivity.release(captive);

    captive.closeRansom();
    world.free(captive);
    this.outcome = 'paid';

    this.publish(new CaptiveJudgedEvent(captive, 'ransomed'));
    const updated = isDefined(vacated)
      ? [home, battlefield, vacated]
      : [home, battlefield];
    this.publishUpdates([...new Set(updated)]);
  }
}
