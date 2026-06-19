import { describe, expect, it } from 'vitest';

import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

const SOURCE_TROOPS = 100;
const SOURCE_FOOD = 100;

function advanceTo(world: World, province: Province): void {
  world.turnQueue.reset();

  while (
    world.turnQueue.current &&
    !world.turnQueue.current.isEqual(province)
  ) {
    world.turnQueue.next();
  }
}

function setup() {
  const ruler = makeGeneral({ name: 'Erin' });
  const family = makeFamily({ name: 'Blanche', ruler, members: [ruler] });
  const rival = makeFamily({ name: 'Crowe' });

  const source = makeProvince({
    number: 1,
    name: 'Rodale',
    neighbors: [2, 3, 4],
    family,
    troops: SOURCE_TROOPS,
    food: SOURCE_FOOD,
  });
  const owned = makeProvince({
    number: 2,
    name: 'Ulster',
    neighbors: [1],
    family,
  });
  const neutral = makeProvince({ number: 3, name: 'Hollow', neighbors: [1] });
  const enemy = makeProvince({
    number: 4,
    name: 'Hertzog',
    neighbors: [1],
    family: rival,
  });
  const distant = makeProvince({
    number: 5,
    name: 'Mauseio',
    neighbors: [],
    family,
  });

  const { world, events } = makeWorld(
    [source, owned, neutral, enemy, distant],
    family,
  );
  const command = new MoveTroopsCommand({ world, events });

  advanceTo(world, source);

  return { ruler, family, source, owned, neutral, enemy, distant, command };
}

describe('MoveTroopsCommand', () => {
  it('reinforces an adjacent province you own without changing its ownership', () => {
    const { family, source, owned, command } = setup();

    command.moveTo(owned, 60, 30);
    command.execute();

    expect(source.resources.troops).toBe(SOURCE_TROOPS - 60);
    expect(source.resources.food).toBe(SOURCE_FOOD - 30);
    expect(owned.resources.troops).toBe(60);
    expect(owned.resources.food).toBe(30);
    expect(owned.belongsTo(family)).toBe(true);
    expect(owned.governor).toBeUndefined();
    expect(source.goodwill).toBe(0);
    expect(source.actionCount).toBe(1);
  });

  it('claims an adjacent neutral province, ruled remotely by the ruler', () => {
    const { ruler, family, neutral, command } = setup();

    command.moveTo(neutral, 60, 30);
    command.execute();

    expect(neutral.belongsTo(family)).toBe(true);
    expect(neutral.ruledBy(ruler)).toBe(true);
    expect(neutral.isRemotelyRuled).toBe(true);
    expect(neutral.resources.troops).toBe(60);
    expect(neutral.resources.food).toBe(30);
  });

  it('offers adjacent provinces you own or that are neutral only', () => {
    const { command } = setup();

    expect([...command.selectableTargets].sort()).toEqual([2, 3]);
  });
});
