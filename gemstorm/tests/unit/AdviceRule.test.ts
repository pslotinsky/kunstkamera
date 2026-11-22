import { describe, expect, it } from 'vitest';

import { AdviceRule } from '@/core/domain/AdviceRule';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { HiredUnit } from '@/core/domain/HiredUnit';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
  type ProvinceParams,
} from './factories';

interface Situation {
  readonly month?: number;
  readonly home?: ProvinceParams;
  readonly isGuarded?: boolean;
  readonly rivals?: readonly number[];
  readonly unclaimed?: number;
  readonly roll?: number;
}

const CALM: ProvinceParams = {
  gold: 1000,
  food: 1000,
  troops: 500,
  loyalty: 100,
  cultivation: 100,
  protection: 100,
};

function setup(situation: Situation = {}) {
  const avar = makeGeneral({ name: 'Avar' });
  const player = makeFamily({ name: 'Alderwyn', ruler: avar });
  const rival = makeFamily({ name: 'Varrengard' });
  const rivals = (situation.rivals ?? []).map((troops, index) =>
    makeProvince({
      number: index + 2,
      name: `Rival ${index + 1}`,
      neighbors: [1],
      family: rival,
      troops,
    }),
  );
  const unclaimed = Array.from(
    { length: situation.unclaimed ?? 0 },
    (_, index) =>
      makeProvince({
        number: rivals.length + index + 2,
        name: `Unclaimed ${index + 1}`,
        neighbors: [1],
      }),
  );
  const home = makeProvince({
    number: 1,
    name: 'Whitehaven',
    neighbors: [...rivals, ...unclaimed].map((province) => province.number),
    family: player,
    governor: avar,
    ...CALM,
    ...situation.home,
  });

  player.homeProvince = home;

  if (situation.isGuarded ?? true) {
    home.fifthUnits.addUnit(HiredUnit.ofName('Spearmen')!);
  }

  const { world } = makeWorld(
    [home, ...rivals, ...unclaimed],
    player,
    new CalendarDate(1186, situation.month ?? 1),
  );
  const rule = new AdviceRule(world, () => situation.roll ?? 0);

  advanceTo(world, home);

  return { world, rule, home, rivals, unclaimed, player, rival };
}

function advise(situation: Situation = {}) {
  const { rule, home } = setup(situation);

  return rule.advise(home);
}

describe('AdviceRule', () => {
  it('warns of a shortage in both stores before anything else', () => {
    const advice = advise({ home: { gold: 0, food: 0 }, rivals: [100] });

    expect(advice.meaning).toBe('poor-in-both');
  });

  it('expects Gold for the lord’s keep, a fifth of Cultivation', () => {
    const situation = { isGuarded: false, rivals: [100] };

    expect(
      advise({ ...situation, home: { cultivation: 100, gold: 19 } }).meaning,
    ).toBe('find-gold');
    expect(
      advise({ ...situation, home: { cultivation: 100, gold: 20 } }).meaning,
    ).toBe('attack');
  });

  it('expects Gold for hired units even with no lord to keep', () => {
    const { cost } = HiredUnit.ofName('Spearmen')!;
    const situation = { rivals: [100] };

    expect(
      advise({ ...situation, home: { governor: undefined, gold: cost - 1 } })
        .meaning,
    ).toBe('find-gold');
    expect(
      advise({ ...situation, home: { governor: undefined, gold: cost } })
        .meaning,
    ).toBe('attack');
  });

  it('expects Food for a tenth of the soldiers', () => {
    const situation = { rivals: [100] };

    expect(
      advise({ ...situation, home: { troops: 500, food: 49 } }).meaning,
    ).toBe('starving');
    expect(
      advise({ ...situation, home: { troops: 500, food: 50 } }).meaning,
    ).toBe('attack');
  });

  it('asks the topics in the season’s order', () => {
    const situation = {
      home: { loyalty: 50 },
      isGuarded: false,
      rivals: [200],
    };

    expect(advise({ ...situation, month: 3 }).meaning).toBe('attack');
    expect(advise({ ...situation, month: 6 }).meaning).toBe('be-generous');
    expect(advise({ ...situation, month: 10 }).meaning).toBe('hire-monsters');
  });

  it.each([
    { month: 1, meaning: 'praise' },
    { month: 5, meaning: 'thought' },
    { month: 9, meaning: 'patience' },
  ])(
    'falls back on the season’s idle line in month $month',
    ({ month, meaning }) => {
      expect(advise({ month }).meaning).toBe(meaning);
    },
  );

  it('urges an attack on the weakest rival below two thirds of its soldiers', () => {
    const { rule, home, rivals } = setup({ rivals: [333, 250, 334] });

    const advice = rule.advise(home);

    expect(advice.meaning).toBe('attack');
    expect(advice.target).toBe(rivals[1]);
    expect(advise({ rivals: [334] }).meaning).toBe('praise');
  });

  it('never urges an attack on an ally', () => {
    const { rule, home, player, rival } = setup({ rivals: [200] });

    player.formAlliance(rival);

    expect(rule.advise(home).meaning).not.toBe('attack');
  });

  it('points at an unclaimed neighbour only when no rival borders', () => {
    const { rule, home, unclaimed } = setup({ unclaimed: 2, roll: 0.9 });

    expect(rule.advise(home).meaning).toBe('no-ruler');
    expect(rule.advise(home).target).toBe(unclaimed[1]);
    expect(advise({ unclaimed: 1, rivals: [400] }).meaning).toBe('praise');
  });

  it('urges a larger army only when a neighbouring rival outnumbers it', () => {
    const situation = { month: 10, home: { troops: 299 } };

    expect(advise({ ...situation, rivals: [300] }).meaning).toBe(
      'enlarge-army',
    );
    expect(advise({ ...situation, rivals: [299] }).meaning).toBe('patience');
  });

  it.each([
    { home: { troops: 299 }, meaning: 'enlarge-army', month: 10 },
    { home: { troops: 300 }, meaning: 'patience', month: 10 },
    { home: { loyalty: 74 }, meaning: 'be-generous', month: 6 },
    { home: { loyalty: 75 }, meaning: 'thought', month: 6 },
    { home: { cultivation: 74 }, meaning: 'cultivate', month: 6 },
    { home: { cultivation: 75 }, meaning: 'thought', month: 6 },
    { home: { protection: 74 }, meaning: 'prepare-for-disasters', month: 6 },
    { home: { protection: 75 }, meaning: 'thought', month: 6 },
  ])('holds its threshold at $home: $meaning', ({ home, meaning, month }) => {
    expect(advise({ home, month, rivals: [1000] }).meaning).toBe(meaning);
  });

  it('picks at random among the lines that apply', () => {
    const situation = {
      month: 10,
      home: { troops: 200 },
      isGuarded: false,
      rivals: [1000],
    };

    expect(
      [0, 0.4, 0.9].map((roll) => advise({ ...situation, roll }).meaning),
    ).toEqual(['enlarge-army', 'hire-monsters', 'hire-mercenaries']);
  });

  it('only advises on the player’s own province turn', () => {
    const { world, rule, home, rivals } = setup({ rivals: [100] });
    const rivalSeat = rivals[0]!;

    expect(rule.canAdvise(home)).toBe(true);
    expect(rule.canAdvise(rivalSeat)).toBe(false);

    advanceTo(world, rivalSeat);

    expect(rule.canAdvise(home)).toBe(false);
  });
});
