import { describe, expect, it } from 'vitest';

import { Development } from '@/core/domain/Development';
import { Resources } from '@/core/domain/Resources';
import { Stat } from '@/core/domain/Stat';

describe('Stat', () => {
  it('clamps additions to 0…max', () => {
    const stat = new Stat(990, 999);

    expect(stat.increase(50).value).toBe(999);
    expect(stat.increase(-1000).value).toBe(0);
    expect(stat.increase(-100).value).toBe(890);
  });

  it('caps resources and development at their maxima', () => {
    const resources = Resources.from({
      gold: 990,
      food: 990,
      troops: 990,
    }).increase({
      gold: 50,
      food: 50,
      troops: 50,
    });

    expect(resources.gold).toBe(999);
    expect(resources.food).toBe(999);
    expect(resources.troops).toBe(999);

    const development = Development.from({
      loyalty: 95,
      cultivation: 195,
      protection: 195,
    }).increase({
      loyalty: 10,
      cultivation: 10,
      protection: 10,
    });

    expect(development.loyalty).toBe(100);
    expect(development.cultivation).toBe(200);
    expect(development.protection).toBe(200);
  });
});
