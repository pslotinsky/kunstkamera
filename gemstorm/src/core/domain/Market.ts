import { sample } from '@/lib/array/sample';

import { MarketRate } from './MarketRate';

const RATE_CHANGE_MONTHS = [2, 5, 8, 11];
const RATES = [MarketRate.LOW, MarketRate.AVERAGE, MarketRate.HIGH];

export class Market {
  public rate: MarketRate;

  public constructor(rate = MarketRate.AVERAGE) {
    this.rate = rate;
  }

  public swing(month: number): void {
    if (RATE_CHANGE_MONTHS.includes(month)) {
      const otherRates = RATES.filter((rate) => rate !== this.rate);

      this.rate = sample(otherRates);
    }
  }

  public toFood(gold: number): number {
    return this.rate.toFood(gold);
  }

  public toGold(food: number): number {
    return this.rate.toGold(food);
  }
}
