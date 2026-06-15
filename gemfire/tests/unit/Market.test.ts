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
  it('lands on the only rate a fixed-season month allows', () => {
    const market = new Market();

    for (let attempt = 0; attempt < 20; attempt++) {
      market.swing(7);
      expect(market.rate).toBe(MarketRate.LOW);

      market.swing(3);
      expect(market.rate).toBe(MarketRate.HIGH);
    }
  });

  it('only ever lands on a rate the month allows', () => {
    const market = new Market();
    const allowedInSeptember = [MarketRate.LOW, MarketRate.AVERAGE];

    for (let attempt = 0; attempt < 50; attempt++) {
      market.swing(9);
      expect(allowedInSeptember).toContain(market.rate);
    }
  });
});
