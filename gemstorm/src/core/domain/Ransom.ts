import type { Family } from './Family';
import type { General } from './General';
import type { Province } from './Province';

export type RansomCurrency = 'gold' | 'food';

const STAT_DIVISOR = 5;
const BASE_DEMAND = 10;
const FOOD_MULTIPLIER = 2;
const KIN_MULTIPLIER = 1.5;
const GUARANTEED_PAYMENT_RATIO = 1.5;
const LIKELY_PAYMENT_RATIO = 1.2;
const LIKELY_PAYMENT_CHANCE = 0.75;
const MINIMUM_PAYMENT_CHANCE = 0.05;

export class Ransom {
  public static forGeneral(general: General, house: Family): Ransom {
    const { intelligence, war } = general.stats;
    const share = Math.floor((intelligence + war) / STAT_DIVISOR);
    const multiplier = general.isKinOf(house) ? KIN_MULTIPLIER : 1;
    const gold = Math.floor((share + BASE_DEMAND) * multiplier);
    const food = Math.floor(
      (share * FOOD_MULTIPLIER + BASE_DEMAND) * multiplier,
    );

    return new Ransom(gold, food);
  }

  public constructor(
    public readonly gold: number,
    public readonly food: number,
  ) {}

  public canPay(currency: RansomCurrency, home: Province): boolean {
    return home.resources[currency] >= this[currency];
  }

  public willPay(currency: RansomCurrency, home: Province): boolean {
    const available = home.resources[currency];
    const amount = this[currency];
    let agrees = available >= amount * GUARANTEED_PAYMENT_RATIO;

    if (!agrees && available >= amount) {
      const chance =
        available >= amount * LIKELY_PAYMENT_RATIO
          ? LIKELY_PAYMENT_CHANCE
          : MINIMUM_PAYMENT_CHANCE;

      agrees = Math.random() < chance;
    }

    return agrees;
  }

  public pay(currency: RansomCurrency, from: Province, to: Province): void {
    if (this.canPay(currency, from)) {
      const payment = { [currency]: this[currency] };

      from.reduceResources(payment);
      to.addResources(payment);
    }
  }
}
