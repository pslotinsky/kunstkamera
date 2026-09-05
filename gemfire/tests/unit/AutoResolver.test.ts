import { describe, expect, it } from 'vitest';

import { Army, type ArmyParams } from '@/core/domain/Army';
import { AutoResolver } from '@/core/domain/AutoResolver';
import { Battle } from '@/core/domain/Battle';

import { makeGeneral } from './factories';

const AMPLE_FOOD = 999;

interface SideParams {
  readonly troops: number;
  readonly war?: number;
  readonly food?: number;
}

function makeArmy(side: SideParams, name: string): Army {
  const params: ArmyParams = {
    commander: makeGeneral({ name, war: side.war ?? 50 }),
    troops: side.troops,
    food: side.food ?? AMPLE_FOOD,
  };

  return new Army(params);
}

function resolve(attacker: SideParams, defender: SideParams) {
  return new AutoResolver().resolve(
    new Battle({
      attacker: makeArmy(attacker, 'Erin'),
      defender: makeArmy(defender, 'Seth'),
    }),
  );
}

describe('AutoResolver', () => {
  it('gives the battle to a decisively stronger attacker', () => {
    const outcome = resolve({ troops: 400 }, { troops: 100 });

    expect(outcome.isWonBy('attacker')).toBe(true);
    expect(outcome.reason).toBe('rout');
  });

  it('never leaves an army worse off under a higher-WAR commander', () => {
    const led = resolve({ troops: 150, war: 90 }, { troops: 130 });
    const misled = resolve({ troops: 150, war: 20 }, { troops: 130 });

    expect(led.attackerSurvivors).toBeGreaterThanOrEqual(
      misled.attackerSurvivors,
    );
    expect(led.defenderSurvivors).toBeLessThanOrEqual(misled.defenderSurvivors);
  });

  it('loses the battle for an army that runs out of food, however strong', () => {
    const outcome = resolve({ troops: 500, food: 51 }, { troops: 200 });

    expect(outcome.isWonBy('defender')).toBe(true);
    expect(outcome.reason).toBe('starvation');
    expect(outcome.attackerSurvivors).toBeGreaterThan(
      outcome.defenderSurvivors,
    );
  });

  it('leaves an even fight to the defender once five days pass', () => {
    const outcome = resolve({ troops: 200 }, { troops: 200 });

    expect(outcome.isWonBy('defender')).toBe(true);
    expect(outcome.reason).toBe('endurance');
    expect(outcome.days).toBe(5);
  });
});
