import { describe, expect, it } from 'vitest';

import { Army } from '@/core/domain/Army';
import { Gem } from '@/core/domain/Gem';
import { HiredUnit } from '@/core/domain/HiredUnit';

import { makeGeneral } from './factories';

const TROOPS = 156;
const FOOD = 120;

function makeArmy(unit?: HiredUnit | Gem) {
  return new Army({
    commander: makeGeneral({ name: 'Erin' }),
    troops: TROOPS,
    food: FOOD,
    unit: unit instanceof Gem ? unit.guardian : unit,
  });
}

describe('Army', () => {
  it('feeds a hired unit and exempts a gem guardian', () => {
    const hired = makeArmy(HiredUnit.ofName('Spearmen'));
    const summoned = makeArmy(Gem.ofName('Zendor'));

    expect(hired.dailyFood).toBe(31);
    expect(hired.supplyDays).toBe(3);
    expect(summoned.dailyFood).toBe(16);
    expect(summoned.supplyDays).toBe(7);
  });

  it('charges deployment gold by the troops committed', () => {
    expect(makeArmy().deploymentCost).toBe(29);
  });
});
