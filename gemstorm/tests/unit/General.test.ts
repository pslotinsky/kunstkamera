import { afterEach, describe, expect, it, vi } from 'vitest';

import { CalendarDate } from '@/core/domain/CalendarDate';

import { makeGeneral } from './factories';

const NOW = new CalendarDate(1200, 1);

describe('General', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['ruler', 0.8, 2],
    ['lord', 0.5, 1],
    ['vassal', 0.15, 1],
  ] as const)(
    'applies the %s growth chance to all three stats',
    (rank, chance, gain) => {
      const general = makeGeneral({
        birth: new CalendarDate(1136, 1),
        charisma: 200,
      });
      const roll = vi.spyOn(Math, 'random').mockReturnValue(chance);

      general.ageYear(NOW, rank);
      expect(general.stats.war).toBe(50);

      roll.mockReturnValue(chance - 0.01);
      general.ageYear(NOW, rank);
      expect(general.stats).toMatchObject({
        intelligence: 50 + gain,
        war: 50 + gain,
        charisma: 200,
      });
    },
  );

  it('loses five in each stat at age 65 even if the growth roll would pass', () => {
    const general = makeGeneral({
      birth: new CalendarDate(1135, 1),
      charisma: 2,
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);

    general.ageYear(NOW, 'ruler');

    expect(general.stats).toMatchObject({
      intelligence: 45,
      war: 45,
      charisma: 0,
    });
  });

  it('starts old-age risk at 75 and caps it at certainty', () => {
    const general = makeGeneral({ birth: new CalendarDate(1126, 1) });

    expect(general.getDeathRisk(NOW)).toBe(0);
    expect(general.getDeathRisk(new CalendarDate(1201, 1))).toBe(0.75);
    expect(general.getDeathRisk(new CalendarDate(1227, 1))).toBe(1);
  });
});
