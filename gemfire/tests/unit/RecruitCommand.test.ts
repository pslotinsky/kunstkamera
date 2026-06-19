import { describe, expect, it } from 'vitest';

import { RecruitCommand } from '@/core/commands/province/RecruitCommand';

import { makeFamily, makeProvince, makeWorld } from './factories';

const INITIAL_GOLD = 100;
const INITIAL_TROOPS = 50;

function createFixture(options: { readonly gold?: number } = {}) {
  const family = makeFamily({ name: 'Blanche' });
  const province = makeProvince({
    number: 1,
    family,
    gold: options.gold ?? INITIAL_GOLD,
    troops: INITIAL_TROOPS,
  });
  const { world, events } = makeWorld([province], family);
  const command = new RecruitCommand({ world, events });

  return { province, command };
}

describe('RecruitCommand', () => {
  it('spends two gold per troop and records the deed at goodwill -1', () => {
    const { province, command } = createFixture();

    command.recruit(20);
    command.execute();

    expect(province.resources.gold).toBe(INITIAL_GOLD - 40);
    expect(province.resources.troops).toBe(INITIAL_TROOPS + 20);
    expect(province.goodwill).toBe(-1);
    expect(province.actionCount).toBe(1);
  });

  it('refuses a levy the province cannot afford', () => {
    const { province, command } = createFixture({ gold: 30 });

    command.recruit(20);
    command.execute();

    expect(province.resources.gold).toBe(30);
    expect(province.resources.troops).toBe(INITIAL_TROOPS);
    expect(province.actionCount).toBe(0);
  });
});
