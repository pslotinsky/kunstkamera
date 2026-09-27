import { describe, expect, it } from 'vitest';

import { Battlefield } from '@/core/domain/Battlefield';
import { BattleSide } from '@/core/domain/BattleSide';
import { BattleUnit } from '@/core/domain/BattleUnit';
import type { Clash } from '@/core/domain/Clash';
import { Facing } from '@/core/domain/Facing';
import { FifthUnit } from '@/core/domain/FifthUnit';
import { StandardUnit } from '@/core/domain/StandardUnit';
import type { RangePattern, Unit } from '@/core/domain/Unit';

import { makeGeneral } from './factories';

const LONDRE = 22;
const TARGET_COLUMN = 3;
const TARGET_ROW = 3;

const field = Battlefield.ofProvince(LONDRE);

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
    name: 'Pluvius',
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
    commander: makeGeneral({ war }),
    strength,
    cell: field.getCell(column, row)!,
    facing,
  });
}

function duel(setup: Duel): Clash {
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

  return striker.strikeAt(target);
}

describe('Clash', () => {
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

  it('is worth more from the rear than the flank, and more than the front', () => {
    const front = duel({ from: [2, 3] }).losses;
    const flank = duel({ from: [3, 2] }).losses;
    const rear = duel({ from: [4, 3] }).losses;

    expect(flank).toBeGreaterThan(front);
    expect(rear).toBeGreaterThan(flank);
  });

  it('sharpens the troops a better commander leads', () => {
    const plain = duel({ from: [2, 3] });
    const sharpened = duel({ from: [2, 3], strikerWar: 90 });
    const shielded = duel({ from: [2, 3], targetWar: 90 });

    expect(sharpened.losses).toBeGreaterThanOrEqual(plain.losses);
    expect(sharpened.backlash).toBeLessThanOrEqual(plain.backlash);
    expect(shielded.losses).toBeLessThanOrEqual(plain.losses);
  });

  it('takes backlash for closing to melee and none from two cells away', () => {
    expect(duel({ from: [2, 3] }).backlash).toBeGreaterThan(0);
    expect(duel({ from: [1, 3], range: 'long' }).backlash).toBe(0);
    expect(duel({ from: [1, 3], range: 'circular' }).backlash).toBe(0);
  });

  it('draws less backlash from the rear than from the front', () => {
    expect(duel({ from: [4, 3] }).backlash).toBeLessThan(
      duel({ from: [2, 3] }).backlash,
    );
  });

  it('measures backlash against what survived the blow', () => {
    const whole = duel({ from: [2, 3], targetStrength: 40 });
    const spent = duel({ from: [2, 3], targetStrength: 12 });

    expect(spent.backlash).toBeLessThan(whole.backlash);
  });

  it('never takes a unit below zero, and never costs nothing', () => {
    const fatal = duel({ from: [2, 3], strikerStrength: 400 });
    const feeble = duel({ from: [2, 3], strikerStrength: 1 });

    expect(fatal.losses).toBe(40);
    expect(fatal.targetLeft).toBe(0);
    expect(fatal.isFatal).toBe(true);
    expect(fatal.backlash).toBe(0);
    expect(feeble.losses).toBe(1);
  });
});
