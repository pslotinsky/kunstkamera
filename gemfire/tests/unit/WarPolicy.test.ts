import { describe, expect, it } from 'vitest';

import { WarPolicy } from '@/core/ai/WarPolicy';
import { HiredUnit } from '@/core/domain/HiredUnit';
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
  readonly troops?: number;
  readonly weakDefenders?: number;
  readonly strongDefenders?: number;
  readonly unclaimed?: boolean;
}

function setup(params: SetupParams = {}) {
  const ander = makeGeneral({ name: 'Ander' });
  const rival = makeFamily({ name: 'Lyle', ruler: ander });
  const player = makeFamily({ name: 'Blanche' });
  const friend = makeFamily({ name: 'Fitzroy' });

  rival.formAlliance(friend);

  const source = makeProvince({
    number: 1,
    neighbors: [2, 3, 4, 5],
    family: rival,
    governor: ander,
    gold: 200,
    food: 400,
    troops: params.troops ?? 300,
  });
  const weak = makeProvince({
    number: 2,
    name: 'Hyland',
    neighbors: [1],
    family: player,
    troops: params.weakDefenders ?? 100,
  });
  const strong = makeProvince({
    number: 3,
    name: 'Carveti',
    neighbors: [1],
    family: player,
    troops: params.strongDefenders ?? 400,
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

  const attacked: Province[] = [];

  events.subscribe(DefenseRequestedEvent, (event) =>
    attacked.push(event.invasion.target),
  );
  advanceTo(world, source);

  const play = () =>
    new WarPolicy({ world, events }).chooseCommand(source)?.execute();

  return { source, weak, empty, rival, attacked, play };
}

describe('WarPolicy', () => {
  it('claims an unclaimed neighbour first, leaving a garrison behind', () => {
    const { source, empty, rival, play } = setup({ unclaimed: true });

    play();

    expect(empty.belongsTo(rival)).toBe(true);
    expect(empty.resources.troops).toBe(200);
    expect(source.resources.troops).toBe(100);
  });

  it('attacks the weakest hostile neighbour, never the weaker ally', () => {
    const { weak, attacked, play } = setup();

    play();

    expect(attacked).toEqual([weak]);
  });

  it('attacks with a quarter more strength, but not just short of it', () => {
    const atEdge = setup({ troops: 300, weakDefenders: 160 });
    const short = setup({ troops: 300, weakDefenders: 161 });

    atEdge.play();
    short.play();

    expect(atEdge.attacked).toHaveLength(1);
    expect(short.attacked).toHaveLength(0);
  });

  it('counts the Fifth Unit that would defend the target', () => {
    const { weak, attacked, play } = setup({ weakDefenders: 100 });

    weak.addUnit(HiredUnit.ofName('Orks')!);
    play();

    expect(attacked).toHaveLength(0);
  });
});
