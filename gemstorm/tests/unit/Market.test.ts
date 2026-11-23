import { describe, expect, it } from 'vitest';

import { Market } from '@/core/domain/Market';
import { MarketRate } from '@/core/domain/MarketRate';

describe('MarketRate', () => {
  it('converts both directions at the low rate (1 gold = 2 food)', () => {
    expect(MarketRate.LOW.toFood(10)).toBe(20);
    expect(MarketRate.LOW.toGold(20)).toBe(10);
  });

  it('converts one for one at the average rate', () => {
    expect(MarketRate.AVERAGE.toFood(10)).toBe(10);
    expect(MarketRate.AVERAGE.toGold(10)).toBe(10);
  });

  it('converts both directions at the high rate (2 gold = 1 food)', () => {
    expect(MarketRate.HIGH.toFood(10)).toBe(5);
    expect(MarketRate.HIGH.toGold(10)).toBe(20);
  });
});

describe('Market.swing', () => {
  it('changes to another rate only in the four market months', () => {
    const market = new Market();
    const marketMonths = [2, 5, 8, 11];

    for (let month = 1; month <= 12; month++) {
      const previous = market.rate;
      market.swing(month);

      expect(market.rate === previous).toBe(!marketMonths.includes(month));
    }
  });
});
