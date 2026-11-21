// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Battle } from '@/core/domain/Battle';
import { BattleSide } from '@/core/domain/BattleSide';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { HiredUnit } from '@/core/domain/HiredUnit';

import {
  makeArmy,
  makeGeneral,
  makeBattle as makeShared,
  station,
} from './factories';

const SKYREACH = 22;

function makeBattle(unit?: HiredUnit, war = 50) {
  const battle = makeShared({
    province: SKYREACH,
    attacker: makeArmy({ commander: makeGeneral({ war }), troops: 160, unit }),
    defender: makeArmy({ troops: 1 }),
  });

  for (const guard of battle.getUnits(BattleSide.defender)) {
    guard.cell = battle.field.getCell(9, 7)!;
  }

  return battle;
}

function findKind(battle: Battle, name: string): BattleUnit {
  return battle
    .getUnits(BattleSide.attacker)
    .find((unit) => unit.name === name)!;
}

function luck(roll: number) {
  vi.spyOn(Math, 'random').mockReturnValue(roll);
}

describe('fences', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lets only Knights build', () => {
    const battle = makeBattle(HiredUnit.ofName('Grimhides')!);
    const site = battle.field.getCell(9, 4)!;

    luck(0);
    for (const name of ['Horsemen', 'Archers', 'Grimhides']) {
      const unit = station(battle, findKind(battle, name), 9, 3);

      expect(battle.getBuildSites(unit)).toEqual([]);
      expect(battle.build(unit, site)).toBe(false);
      expect(unit.hasActed).toBe(false);
    }

    expect(site.terrain).toBe('plains');
  });

  it('offers open ground beside the builder and nothing else', () => {
    const battle = makeBattle();
    const knights = station(battle, findKind(battle, 'Knights'), 9, 3);
    const sites = battle.getBuildSites(knights).map((cell) => cell.name);

    expect(battle.field.getCell(8, 3)!.terrain).toBe('fence');
    expect(sites).toEqual(['J3', 'J5']);
  });

  it('refuses a flag, water, stone and occupied ground', () => {
    const battle = makeBattle();
    const flag = battle.field.defenderFlag;
    const knights = station(
      battle,
      findKind(battle, 'Knights'),
      flag.column + 1,
      flag.row,
    );
    const neighbour = station(
      battle,
      findKind(battle, 'Horsemen'),
      flag.column + 2,
      flag.row,
    );
    const sites = battle.getBuildSites(knights);

    expect(sites).not.toContain(flag);
    expect(sites).not.toContain(neighbour.cell);
  });

  it('raises a fence that stops troops and not fliers', () => {
    const battle = makeBattle(HiredUnit.ofName('Wyverns')!);
    const knights = station(battle, findKind(battle, 'Knights'), 9, 3);
    const rider = station(battle, findKind(battle, 'Horsemen'), 9, 1);
    const wyverns = station(battle, findKind(battle, 'Wyverns'), 9, 6);
    const site = battle.field.getCell(9, 4)!;

    luck(0);
    expect(battle.build(knights, site)).toBe(true);
    expect(site.terrain).toBe('fence');
    expect(site.sprite).toBe('fence');
    expect(knights.hasActed).toBe(true);

    expect(battle.getMoveRange(rider).includes(site)).toBe(false);
    expect(battle.getMoveRange(wyverns).includes(site)).toBe(true);
  });

  it('leaves the ground alone when the work fails, and spends the turn anyway', () => {
    const battle = makeBattle();
    const knights = station(battle, findKind(battle, 'Knights'), 9, 3);
    const site = battle.field.getCell(9, 4)!;

    luck(0.99);
    expect(battle.build(knights, site)).toBe(false);
    expect(site.terrain).toBe('plains');
    expect(knights.hasActed).toBe(true);

    const fence = battle.field.getCell(8, 3)!;
    luck(0);
    expect(battle.breakDown(knights, fence)).toBe(false);
    expect(fence.terrain).toBe('fence');
  });

  it('breaks a fence into passable wreckage', () => {
    const battle = makeBattle();
    const rider = station(battle, findKind(battle, 'Horsemen'), 9, 3);
    const fence = battle.field.getCell(8, 3)!;

    expect(battle.getBreakable(rider)).toContain(fence);

    luck(0);
    expect(battle.breakDown(rider, fence)).toBe(true);
    expect(fence.terrain).toBe('plains');
    expect(fence.sprite).toBe('fence-broken');
    rider.refresh();

    expect(battle.getMoveRange(rider).includes(fence)).toBe(true);
  });

  it.each([
    [1, 0, 0.06],
    [40, 50, 0.44],
    [40, 100, 0.47],
    [95, 0, 0.96],
    [96, 0, 1],
  ])('gives Strength %s and WAR %s fence odds of %s', (strength, war, odds) => {
    const battle = makeBattle(undefined, war);
    const knights = findKind(battle, 'Knights');

    knights.strength = strength;

    expect(knights.fenceOdds).toBe(odds);
  });

  it('uses the same odds for breaking and spends the action on a failed break', () => {
    const battle = makeBattle(undefined, 0);
    const rider = station(battle, findKind(battle, 'Horsemen'), 9, 3);
    const fence = battle.field.getCell(8, 3)!;

    luck(0.99);
    rider.strength = 95;
    expect(battle.breakDown(rider, fence)).toBe(false);
    expect(fence.terrain).toBe('fence');
    expect(rider.hasActed).toBe(true);

    rider.refresh();
    rider.strength = 96;
    expect(battle.breakDown(rider, fence)).toBe(true);
    expect(fence.terrain).toBe('plains');
  });

  it('never changes the ground of another battle on the same province', () => {
    const first = makeBattle();
    const knights = station(first, findKind(first, 'Knights'), 9, 3);

    luck(0);
    first.build(knights, first.field.getCell(9, 4)!);

    const second = makeBattle();

    expect(second.field.getCell(9, 4)!.terrain).toBe('plains');
  });
});
