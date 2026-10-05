import { describe, expect, it } from 'vitest';

import { EconomyPolicy } from '@/core/ai/EconomyPolicy';
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
  const ander = makeGeneral({ name: 'Ander' });
  const seth = makeGeneral({ name: 'Seth', intelligence: 90 });
  const idle = makeGeneral({ name: 'Idle', intelligence: 70 });
  const rival = makeFamily({
    name: 'Lyle',
    ruler: ander,
    members: [ander, seth, idle],
  });
  const player = makeFamily({ name: 'Blanche' });

  const interior = makeProvince({
    number: 1,
    neighbors: [2],
    family: rival,
    governor: ander,
    troops: 90,
  });
  const middle = makeProvince({
    number: 2,
    neighbors: [1, 3],
    family: rival,
    governor: ander,
  });
  const border = makeProvince({
    number: 3,
    neighbors: [2, 4],
    family: rival,
    governor: seth,
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
  const play = (province: Province) => {
    advanceTo(world, province);
    policy.chooseCommand(province)?.execute();
  };
  const trade = (province: Province) => {
    advanceTo(world, province);
    policy.chooseTrade(province)?.execute();
  };

  return { world, interior, middle, border, idle, policy, play, trade };
}

describe('EconomyPolicy', () => {
  it('recruits on a border short of its threat, keeping a gold reserve', () => {
    const threatened = setup({ gold: 100, troops: 50, threat: 200 });
    const safe = setup({ gold: 100, troops: 50, threat: 40 });

    threatened.play(threatened.border);
    safe.play(safe.border);

    expect(threatened.border.resources).toMatchObject({ troops: 85, gold: 30 });
    expect(safe.border.resources.troops).toBe(50);
  });

  it('sends interior troops one step toward the border', () => {
    const { interior, middle, play } = setup();

    play(interior);

    expect(middle.resources.troops).toBe(60);
    expect(interior.resources.troops).toBe(30);
  });

  it('hires the strongest unit it can afford for a border without one', () => {
    const { border, play } = setup({
      gold: 80,
      hirePool: ['Orks', 'Gargoyles', 'Warriors'],
    });

    play(border);

    expect(border.hiredUnits.map((unit) => unit.name)).toEqual(['Gargoyles']);
  });

  it('gives food where loyalty runs low', () => {
    const { border, play } = setup({ gold: 0, loyalty: 10 });

    play(border);

    expect(border.development.loyalty).toBeGreaterThan(10);
  });

  it('develops whichever of cultivation and protection is lower', () => {
    const { border, play } = setup({
      gold: 20,
      cultivation: 80,
      protection: 30,
    });

    play(border);

    expect(border.development.protection).toBeGreaterThan(30);
    expect(border.development.cultivation).toBe(80);
  });

  it('buys food when short of supply and sells surplus when short of gold', () => {
    const hungry = setup({ gold: 200, food: 0, troops: 200 });
    const broke = setup({ gold: 0, food: 900, troops: 50 });

    hungry.trade(hungry.border);
    broke.trade(broke.border);

    expect(hungry.border.resources.food).toBe(105);
    expect(broke.border.resources.food).toBe(60);
    expect(broke.border.resources.gold).toBeGreaterThan(0);
  });

  it('seats its free vassals in lordless provinces from the home province', () => {
    const { interior, middle, idle, policy, world } = setup();

    advanceTo(world, interior);

    for (const appointment of policy.chooseLords(interior)) {
      appointment.execute();
    }

    expect(middle.governor).toBe(idle);
  });
});
