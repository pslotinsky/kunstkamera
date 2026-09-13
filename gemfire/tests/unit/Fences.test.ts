// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Army } from '@/core/domain/Army';
import { Battle } from '@/core/domain/Battle';
import { Battlefield } from '@/core/domain/Battlefield';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import { HiredUnit } from '@/core/domain/HiredUnit';

import { makeGeneral } from './factories';

const LONDRE = 22;

// one defender, parked in the corner, so nobody stands where the work happens
function makeBattle(unit?: HiredUnit) {
  const battle = new Battle({
    attacker: new Army({
      commander: makeGeneral(),
      troops: 160,
      food: 400,
      unit,
    }),
    defender: new Army({ commander: makeGeneral(), troops: 1, food: 400 }),
    field: Battlefield.ofProvince(LONDRE),
  });

  for (const guard of battle.getUnits('defender')) {
    guard.cell = battle.field.getCell(9, 7)!;
  }

  return battle;
}

function station(
  battle: Battle,
  unit: BattleUnit,
  column: number,
  row: number,
) {
  unit.cell = battle.field.getCell(column, row)!;

  return unit;
}

function findKind(battle: Battle, name: string): BattleUnit {
  return battle.getUnits('attacker').find((unit) => unit.name === name)!;
}

function luck(roll: number) {
  vi.spyOn(Math, 'random').mockReturnValue(roll);
}

describe('fences', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lets only Knights build', () => {
    const battle = makeBattle(HiredUnit.ofName('Orks')!);

    expect(findKind(battle, 'Knights').canBuild).toBe(true);
    expect(findKind(battle, 'Horsemen').canBuild).toBe(false);
    expect(findKind(battle, 'Archers').canBuild).toBe(false);
    expect(findKind(battle, 'Orks').canBuild).toBe(false);
  });

  it('offers open ground beside the builder and nothing else', () => {
    const battle = makeBattle();
    const knights = station(battle, findKind(battle, 'Knights'), 9, 3);
    const sites = battle.getBuildSites(knights).map((cell) => cell.name);

    // I4 is a fence, J3 and J5 are open, and nothing diagonal is beside it
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
    // the work spent its turn, so the ground is walked on the next one
    rider.refresh();

    expect(battle.getMoveRange(rider).includes(fence)).toBe(true);
  });

  it('raises the odds with the strength doing the work', () => {
    const battle = makeBattle();
    const knights = findKind(battle, 'Knights');
    const whole = knights.fenceOdds;

    knights.takeLosses(knights.strength - 1);

    expect(knights.fenceOdds).toBeLessThan(whole);
    expect(knights.fenceOdds).toBeGreaterThanOrEqual(0.3);
    expect(whole).toBeLessThanOrEqual(0.9);
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
