import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MeleeRollMode } from '@/core/domain/BattleDamage';
import { Battlefield } from '@/core/domain/Battlefield';
import { BattleSide } from '@/core/domain/BattleSide';
import { BattleUnit } from '@/core/domain/BattleUnit';
import type { Clash } from '@/core/domain/Clash';
import { Facing } from '@/core/domain/Facing';
import { FifthUnit } from '@/core/domain/FifthUnit';
import { Gem } from '@/core/domain/Gem';
import { Nerith } from '@/core/domain/Nerith';
import { StandardUnit } from '@/core/domain/StandardUnit';
import type { RangePattern, Unit } from '@/core/domain/Unit';

const SKYREACH = 22;
const TARGET_COLUMN = 3;
const TARGET_ROW = 3;

const field = Battlefield.ofProvince(SKYREACH);

interface Duel {
  readonly from: readonly [number, number];
  readonly facing?: Facing;
  readonly range?: RangePattern;
  readonly strikerStrength?: number;
  readonly targetStrength?: number;
  readonly strikerWar?: number;
  readonly targetWar?: number;
}

function kindOf(range: RangePattern): Unit {
  if (range === 'short') {
    return StandardUnit.ofName('Horsemen')!;
  }

  if (range === 'long') {
    return StandardUnit.ofName('Archers')!;
  }

  return new FifthUnit({
    name: 'Asterion',
    attack: 29,
    defense: 29,
    move: 2,
    range,
    description: 'a guardian',
    strength: 160,
  });
}

function place(
  unit: Unit,
  column: number,
  row: number,
  strength: number,
  war: number,
  facing: Facing,
): BattleUnit {
  return new BattleUnit({
    unit,
    side: BattleSide.attacker,
    slot: 0,
    commanderWar: war,
    strength,
    cell: field.getCell(column, row)!,
    facing,
  });
}

function duel(setup: Duel, meleeRoll: MeleeRollMode = 'average'): Clash {
  const striker = place(
    kindOf(setup.range ?? 'short'),
    setup.from[0],
    setup.from[1],
    setup.strikerStrength ?? 40,
    setup.strikerWar ?? 50,
    Facing.east,
  );
  const target = place(
    StandardUnit.ofName('Knights')!,
    TARGET_COLUMN,
    TARGET_ROW,
    setup.targetStrength ?? 40,
    setup.targetWar ?? 50,
    setup.facing ?? Facing.west,
  );

  return striker.strikeAt(target, meleeRoll);
}

describe('Clash', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([0, 100])('uses the special attack formula at %s WAR', (war) => {
    const striker = place(new Nerith(), 2, 3, 160, war, Facing.east);
    const target = place(
      StandardUnit.ofName('Horsemen')!,
      3,
      3,
      100,
      50,
      Facing.west,
    );
    const random = vi.spyOn(Math, 'random');
    const clash = striker.strikeAt(target);

    expect(striker.strength).toBe(144);
    expect(target.strength).toBe(64);
    expect(clash.backlash).toBe(0);
    expect(clash.fatigue).toBe(16);
    expect(random).not.toHaveBeenCalled();
  });

  it('reads the face a blow lands on from the way the target looks', () => {
    expect(duel({ from: [2, 3] }).approach).toBe('front');
    expect(duel({ from: [4, 3] }).approach).toBe('rear');
    expect(duel({ from: [3, 2] }).approach).toBe('flank');
    expect(duel({ from: [3, 4] }).approach).toBe('flank');
  });

  it('resolves a slanted blow by its dominant axis', () => {
    expect(duel({ from: [1, 2], range: 'largest' }).approach).toBe('front');
    expect(duel({ from: [5, 4], range: 'largest' }).approach).toBe('rear');
    expect(duel({ from: [2, 1], range: 'largest' }).approach).toBe('flank');
  });

  it('counts a blow on the corner as a flank', () => {
    expect(duel({ from: [2, 2], range: 'largest' }).approach).toBe('flank');
    expect(duel({ from: [4, 4], range: 'largest' }).approach).toBe('flank');
  });

  it.each([
    { from: [2, 3], losses: 9, backlash: 6 },
    { from: [3, 2], losses: 13, backlash: 5 },
    { from: [4, 3], losses: 18, backlash: 4 },
  ] as const)(
    'uses the melee facing factors for a strike from $from',
    ({ from, losses, backlash }) => {
      expect(duel({ from })).toMatchObject({ losses, backlash });
    },
  );

  it('sharpens the troops a better commander leads', () => {
    const plain = duel({ from: [2, 3] });
    const sharpened = duel({ from: [2, 3], strikerWar: 90 });
    const shielded = duel({ from: [2, 3], targetWar: 90 });

    expect(sharpened.losses).toBeGreaterThanOrEqual(plain.losses);
    expect(sharpened.backlash).toBeLessThanOrEqual(plain.backlash);
    expect(shielded.losses).toBeLessThanOrEqual(plain.losses);
  });

  it('uses the ranged formula with no return damage or random roll', () => {
    const random = vi.spyOn(Math, 'random');
    const clash = duel(
      { from: [1, 3], range: 'long', strikerStrength: 100, strikerWar: 80 },
      'random',
    );

    expect(clash).toMatchObject({ losses: 14, backlash: 0, fatigue: 0 });
    expect(random).not.toHaveBeenCalled();
  });

  it('rolls defender losses first and uses both starting strengths', () => {
    const random = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.99);
    const clash = duel({ from: [2, 3] }, 'random');

    expect(clash).toMatchObject({ losses: 8, backlash: 7 });
    expect(random).toHaveBeenCalledTimes(2);
  });

  it('applies the melee exchange even when the defender is removed', () => {
    const clash = duel({ from: [2, 3], targetStrength: 1 });

    expect(clash).toMatchObject({ losses: 1, targetLeft: 0, backlash: 1 });
    expect(clash.isFatal).toBe(true);
  });

  it('withdraws a special target below one tenth strength and leaves at least one strength', () => {
    const archer = place(
      StandardUnit.ofName('Archers')!,
      1,
      3,
      100,
      80,
      Facing.east,
    );
    const guardian = place(
      Gem.ofName('Voltryn').guardian,
      3,
      3,
      15,
      50,
      Facing.east,
    );

    expect(guardian.isStanding).toBe(true);
    const clash = archer.strikeAt(guardian);

    expect(clash).toMatchObject({ losses: 14, targetLeft: 1 });
    expect(guardian.isStanding).toBe(false);
    expect(clash.isFatal).toBe(false);
  });

  it('withdraws a special striker if attack fatigue takes it below one tenth strength', () => {
    const striker = place(new Nerith(), 2, 3, 16, 50, Facing.east);
    const target = place(
      StandardUnit.ofName('Knights')!,
      3,
      3,
      40,
      50,
      Facing.west,
    );

    expect(striker.isStanding).toBe(true);
    const clash = striker.strikeAt(target);

    expect(clash).toMatchObject({ fatigue: 1, strikerLeft: 15 });
    expect(striker.isStanding).toBe(false);
  });
});
