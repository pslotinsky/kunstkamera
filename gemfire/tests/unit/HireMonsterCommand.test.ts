import { describe, expect, it } from 'vitest';

import { HireMonsterCommand } from '@/core/commands/province/HireMonsterCommand';

import { makeFamily, makeProvince, makeWorld } from './factories';

const INITIAL_GOLD = 100;

function createFixture(options: { readonly gold?: number } = {}) {
  const family = makeFamily({ name: 'Blanche' });
  const province = makeProvince({
    number: 1,
    family,
    gold: options.gold ?? INITIAL_GOLD,
    hirePool: ['Orks', 'Bugbear'],
  });
  const { world, events } = makeWorld([province], family);
  const command = new HireMonsterCommand({ world, events });

  return { province, events, command };
}

describe('HireMonsterCommand', () => {
  it('stations the chosen unit at its catalogue strength and spends its cost', () => {
    const { province, command } = createFixture();

    command.hire('Orks');
    command.execute();

    expect(province.hiredUnits).toHaveLength(1);
    expect(province.hiredUnits[0]?.type).toBe('Orks');
    expect(province.hiredUnits[0]?.strength).toBe(100);
    expect(province.resources.gold).toBe(INITIAL_GOLD - 20);
  });

  it('offers the pool minus the types already stationed', () => {
    const { command } = createFixture();

    command.hire('Orks');
    command.execute();

    expect([...command.hireableTypes]).toEqual(['Bugbear']);
  });

  it('refuses to hire a type the province cannot afford', () => {
    const { province, command } = createFixture({ gold: 10 });

    command.hire('Orks');
    command.execute();

    expect(province.hiredUnits).toHaveLength(0);
    expect(province.resources.gold).toBe(10);
  });

  it('refuses to hire a type outside the province pool', () => {
    const { province, command } = createFixture();

    command.hire('Wyverns');
    command.execute();

    expect(province.hiredUnits).toHaveLength(0);
  });

  it('refuses to hire a type already stationed', () => {
    const { province, command } = createFixture();

    command.hire('Orks');
    command.execute();
    command.execute();

    expect(province.hiredUnits).toHaveLength(1);
    expect(province.resources.gold).toBe(INITIAL_GOLD - 20);
  });

  it('dismisses a stationed unit, leaving the rest and refunding no gold', () => {
    const { province, command } = createFixture();

    command.hire('Orks');
    command.execute();
    command.hire('Bugbear');
    command.execute();

    const goldAfterHiring = province.resources.gold;

    command.dismiss('Orks');
    command.execute();

    expect(province.hiredUnits.map((unit) => unit.type)).toEqual(['Bugbear']);
    expect(province.resources.gold).toBe(goldAfterHiring);
  });

  it('ignores a dismiss for a type the province does not station', () => {
    const { province, command } = createFixture();

    command.hire('Orks');
    command.execute();

    command.dismiss('Bugbear');
    command.execute();

    expect(province.hiredUnits.map((unit) => unit.type)).toEqual(['Orks']);
  });
});
