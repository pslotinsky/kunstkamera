import { afterEach, describe, expect, it, vi } from 'vitest';

import { EconomyPolicy } from '@/core/ai/EconomyPolicy';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { Province } from '@/core/domain/Province';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

interface SetupParams {
  readonly gold?: number;
  readonly food?: number;
  readonly troops?: number;
  readonly threat?: number;
  readonly loyalty?: number;
  readonly cultivation?: number;
  readonly protection?: number;
  readonly hirePool?: readonly string[];
}

function setup(params: SetupParams = {}) {
  const darian = makeGeneral({ name: 'Darian' });
  const marven = makeGeneral({ name: 'Marven', intelligence: 90 });
  const idle = makeGeneral({ name: 'Idle', intelligence: 70 });
  const rival = makeFamily({
    name: 'Stormmere',
    ruler: darian,
    members: [darian, marven, idle],
  });
  const player = makeFamily({ name: 'Alderwyn' });

  const interior = makeProvince({
    number: 1,
    neighbors: [2],
    family: rival,
    governor: darian,
    troops: 90,
  });
  const middle = makeProvince({
    number: 2,
    neighbors: [1, 3],
    family: rival,
    governor: darian,
  });
  const border = makeProvince({
    number: 3,
    neighbors: [2, 4],
    family: rival,
    governor: marven,
    gold: params.gold ?? 100,
    food: params.food ?? 500,
    troops: params.troops ?? 50,
    loyalty: params.loyalty ?? 80,
    cultivation: params.cultivation ?? 50,
    protection: params.protection ?? 50,
    hirePool: params.hirePool,
  });
  const enemy = makeProvince({
    number: 4,
    neighbors: [3],
    family: player,
    troops: params.threat ?? 0,
  });

  rival.homeProvince = interior;

  const { world, events } = makeWorld(
    [interior, middle, border, enemy],
    player,
  );
  const policy = new EconomyPolicy({ world, events });
  const act = (
    province: Province,
    choose: (target: Province) => WorldCommand | undefined,
  ) => {
    advanceTo(world, province);
    const command = choose(province);
    command?.execute();

    return command;
  };

  return {
    world,
    rival,
    player,
    interior,
    middle,
    border,
    enemy,
    idle,
    policy,
    act,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('EconomyPolicy free preparations', () => {
  it('sells half its Food when short of Gold only', () => {
    const { border, policy, act } = setup({ gold: 10, food: 500 });

    act(border, (province) => policy.chooseTrade(province));

    expect(border.resources.food).toBe(250);
  });

  it('spends half its Gold when short of Food only', () => {
    const { border, policy, act } = setup({ gold: 100, food: 20 });

    act(border, (province) => policy.chooseTrade(province));

    expect(border.resources.gold).toBe(50);
  });

  it('does not trade when short of both or of neither', () => {
    const both = setup({ gold: 10, food: 20 });
    const neither = setup({ gold: 100, food: 500 });

    expect(both.policy.chooseTrade(both.border)).toBeUndefined();
    expect(neither.policy.chooseTrade(neither.border)).toBeUndefined();
  });

  it('draws a quarter of the richest own province’s Gold and Food when short of both', () => {
    const { interior, border, policy, act } = setup({ gold: 10, food: 20 });
    interior.addResources({ gold: 400, food: 200 });

    act(border, (province) => policy.chooseSubsidy(province));

    expect(border.resources).toMatchObject({ gold: 110, food: 70 });
    expect(interior.resources).toMatchObject({ gold: 300, food: 150 });
  });

  it('gives no subsidy to an entrusted province', () => {
    const { border, enemy, player, policy } = setup({ gold: 10, food: 20 });
    enemy.addResources({ gold: 400, food: 200 });
    border.claim(player);
    border.entrust();

    expect(policy.chooseSubsidy(border)).toBeUndefined();
  });

  it('sends one court vassal to a province with no lord, from the ruler’s province', () => {
    const { interior, middle, border, idle, policy, act } = setup();

    expect(policy.chooseLord(border)).toBeUndefined();

    act(interior, (province) => policy.chooseLord(province));

    expect(middle.governor).toBe(idle);
  });
});

describe('EconomyPolicy develop', () => {
  it.each([
    [{ cultivation: 40, loyalty: 40, protection: 40 }, 'cultivation'],
    [{ cultivation: 50, loyalty: 40, protection: 40 }, 'loyalty'],
    [{ cultivation: 50, loyalty: 50, protection: 40 }, 'protection'],
  ] as const)('raises the lowest of %j: %s', (stats, raised) => {
    const { border, policy, act } = setup(stats);

    act(border, (province) => policy.chooseDevelopment(province));

    expect(border.development[raised]).toBeGreaterThan(stats[raised]);
  });

  it('raises Loyalty with the smallest gift of Food', () => {
    const { border, policy, act } = setup({ loyalty: 10, food: 500 });

    act(border, (province) => policy.chooseDevelopment(province));

    expect(border.resources.food).toBe(480);
  });

  it('gives up rather than develop something else when it cannot afford the lowest', () => {
    const { border, policy } = setup({ loyalty: 10, food: 19 });

    expect(policy.chooseDevelopment(border)).toBeUndefined();
  });
});

describe('EconomyPolicy build-up', () => {
  it('reinforces the own border neighbour with half its soldiers', () => {
    const { middle, border, policy, act } = setup({ troops: 50 });
    middle.addResources({ troops: 81 });
    vi.spyOn(Math, 'random').mockReturnValue(0);

    act(middle, (province) => policy.chooseBuildUp(province));

    expect(middle.resources.troops).toBe(41);
    expect(border.resources.troops).toBe(90);
  });

  it('recruits an eighth of its Gold in soldiers for a quarter of it', () => {
    const { border, policy, act } = setup({ gold: 100, troops: 50 });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    act(border, (province) => policy.chooseBuildUp(province));

    expect(border.resources).toMatchObject({ troops: 62, gold: 76 });
  });

  it('hires the first offered unit it can afford and control when the chosen build-up fails', () => {
    const { border, policy, act } = setup({
      gold: 45,
      hirePool: ['Lancers', 'Gunners', 'Bugbear'],
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);

    act(border, (province) => policy.chooseBuildUp(province));

    expect(border.fifthUnits.hiredUnits.map((unit) => unit.name)).toEqual([
      'Gunners',
    ]);
  });

  it('hires nothing while it already keeps a hired unit', () => {
    const { border, policy } = setup({ gold: 5, hirePool: ['Bugbear'] });
    border.fifthUnits.hireUnit(border.fifthUnits.hirePool[0]!);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(policy.chooseBuildUp(border)).toBeUndefined();
  });
});
