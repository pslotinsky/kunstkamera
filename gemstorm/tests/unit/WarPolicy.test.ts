import { describe, expect, it } from 'vitest';

import { WarPolicy } from '@/core/ai/WarPolicy';
import type { Province } from '@/core/domain/Province';
import { DefenseRequestedEvent } from '@/core/events/DefenseRequestedEvent';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

interface SetupParams {
  readonly war?: number;
  readonly remote?: boolean;
  readonly troops?: number;
  readonly weakDefenders?: number;
  readonly strongDefenders?: number;
  readonly unclaimed?: boolean;
  readonly food?: number;
}

function setup(params: SetupParams = {}) {
  const darian = makeGeneral({ name: 'Darian', war: params.war ?? 50 });
  const rival = makeFamily({ name: 'Stormmere', ruler: darian });
  const player = makeFamily({ name: 'Alderwyn' });
  const friend = makeFamily({ name: 'Fitzroy' });

  rival.formAlliance(friend);

  const source = makeProvince({
    number: 1,
    neighbors: [2, 3, 4, 5],
    family: rival,
    governor: darian,
    gold: 200,
    food: params.food ?? 400,
    troops: params.troops ?? 300,
  });
  const weak = makeProvince({
    number: 2,
    name: 'Pineward',
    neighbors: [1],
    family: player,
    troops: params.weakDefenders ?? 100,
  });
  const strong = makeProvince({
    number: 3,
    name: 'Rimewatch',
    neighbors: [1],
    family: player,
    troops: params.strongDefenders ?? 150,
  });
  const allied = makeProvince({
    number: 4,
    name: 'Anjou',
    neighbors: [1],
    family: friend,
  });
  const empty = makeProvince({
    number: 5,
    name: 'Hollow',
    neighbors: [1],
    family: params.unclaimed ? undefined : friend,
  });
  const { world, events } = makeWorld(
    [source, weak, strong, allied, empty],
    player,
  );
  rival.moveHome(params.remote ? allied : source);
  source.assignGovernor(darian);

  const attacked: Province[] = [];
  const sent: number[] = [];

  events.subscribe(DefenseRequestedEvent, (event) => {
    attacked.push(event.invasion.target);
    sent.push(event.invasion.attacker.troops);
  });
  advanceTo(world, source);

  const play = () =>
    new WarPolicy({ world, events }).chooseCommand(source)?.execute();

  return { source, weak, empty, rival, attacked, sent, play };
}

describe('WarPolicy', () => {
  it('expands a third of its Gold, Food, and soldiers into unowned land instead of attacking', () => {
    const { source, empty, rival, attacked, play } = setup({ unclaimed: true });

    play();

    expect(attacked).toEqual([]);
    expect(empty.belongsTo(rival)).toBe(true);
    expect(empty.resources).toMatchObject({ gold: 66, food: 133, troops: 100 });
    expect(source.resources).toMatchObject({
      gold: 134,
      food: 267,
      troops: 200,
    });
  });

  it('attacks the hostile neighbour with the fewest soldiers, never the ally', () => {
    const { weak, attacked, play } = setup();

    play();

    expect(attacked).toEqual([weak]);
  });

  it.each([
    [100, 150],
    [120, 168],
  ])(
    'sends the larger of its escort and half its soldiers against %s defenders',
    (weakDefenders, troops) => {
      const { sent, play } = setup({ weakDefenders });

      play();

      expect(sent).toEqual([troops]);
    },
  );

  it.each([
    [55, 187, true],
    [55, 188, false],
    [56, 214, true],
    [56, 215, false],
    [99, 250, true],
    [99, 251, false],
    [100, 300, true],
    [100, 301, false],
  ])(
    'with WAR %s needs its edge over every hostile neighbour: %s soldiers next door → %s',
    (war, strongDefenders, attacks) => {
      const { attacked, play } = setup({ war, strongDefenders });

      play();

      expect(attacked.length > 0).toBe(attacks);
    },
  );

  it('judges its edge by half the ruler’s WAR when he rules from afar', () => {
    const bold = setup({ war: 200, remote: true, strongDefenders: 300 });
    const timid = setup({ war: 190, remote: true, strongDefenders: 300 });

    bold.play();
    timid.play();

    expect(bold.attacked).toHaveLength(1);
    expect(timid.attacked).toHaveLength(0);
  });

  it('takes exactly five days of food and skips an attack if it cannot afford them', () => {
    const supplied = setup({ food: 80 });
    const short = setup({ food: 79 });

    supplied.play();
    short.play();

    expect(supplied.attacked).toEqual([supplied.weak]);
    expect(supplied.source.resources.food).toBe(0);
    expect(short.attacked).toEqual([]);
    expect(short.source.resources.food).toBe(79);
  });
});
