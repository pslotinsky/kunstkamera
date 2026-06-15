import { sample } from '@/lib/array/sample';

import { MarketRate } from './MarketRate';

const SEASONAL_RATES: Record<number, readonly MarketRate[]> = {
  1: [MarketRate.AVERAGE, MarketRate.HIGH],
  2: [MarketRate.AVERAGE, MarketRate.HIGH],
  3: [MarketRate.HIGH],
  4: [MarketRate.HIGH],
  5: [MarketRate.HIGH],
  6: [MarketRate.LOW, MarketRate.AVERAGE, MarketRate.HIGH],
  7: [MarketRate.LOW],
  8: [MarketRate.LOW],
  9: [MarketRate.LOW, MarketRate.AVERAGE],
  10: [MarketRate.LOW, MarketRate.AVERAGE],
  11: [MarketRate.LOW, MarketRate.AVERAGE],
  12: [MarketRate.AVERAGE, MarketRate.HIGH],
};

export class Market {
  public rate: MarketRate = MarketRate.AVERAGE;

  public swing(month: number): void {
    this.rate = sample(SEASONAL_RATES[month] ?? [MarketRate.AVERAGE]);
  }

  public toFood(gold: number): number {
    return this.rate.toFood(gold);
  }

  public toGold(food: number): number {
    return this.rate.toGold(food);
  }
}
