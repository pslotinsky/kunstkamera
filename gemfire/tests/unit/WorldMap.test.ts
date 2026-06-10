import { describe, expect, it } from 'vitest';

import { WorldFactory } from '@/core/WorldFactory';

const { map } = new WorldFactory().create();

describe('WorldMap', () => {
  it('getProvince returns the province and throws on an unknown number', () => {
    expect(map.getProvince(10).name).toBe('Rodale');
    expect(() => map.getProvince(31)).toThrow();
  });

  it('has symmetric neighbors: if A is a neighbor of B, B is a neighbor of A', () => {
    for (const province of map.provinces) {
      for (const neighbor of map.getNeighbors(province)) {
        expect(
          neighbor.isNeighbor(province),
          `${neighbor.number} should be a neighbor of ${province.number}`,
        ).toBe(true);
      }
    }
  });

  it('matches the connection counts in appendix A (§A.4)', () => {
    const appendixA4ConnectionCounts: Record<number, number> = {
      1: 2,
      2: 4,
      3: 5,
      4: 2,
      5: 5,
      6: 6,
      7: 5,
      8: 1,
      9: 4,
      10: 7,
      11: 6,
      12: 3,
      13: 3,
      14: 3,
      15: 6,
      16: 5,
      17: 6,
      18: 4,
      19: 4,
      20: 4,
      21: 3,
      22: 7,
      23: 5,
      24: 5,
      25: 3,
      26: 1,
      27: 4,
      28: 7,
      29: 3,
      30: 3,
    };

    for (const [number, count] of Object.entries(appendixA4ConnectionCounts)) {
      expect(
        map.getProvince(Number(number)).neighbors.length,
        `province ${number}`,
      ).toBe(count);
    }
  });
});
