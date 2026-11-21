import { describe, expect, it } from 'vitest';

import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import { HiredUnit } from '@/core/domain/HiredUnit';
import { Nerith } from '@/core/domain/Nerith';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

const SOURCE_GOLD = 100;
const SOURCE_TROOPS = 100;
const SOURCE_FOOD = 100;

function setup() {
  const ruler = makeGeneral({ name: 'Avar' });
  const family = makeFamily({ name: 'Alderwyn', ruler, members: [ruler] });
  const rival = makeFamily({ name: 'Crowe' });

  const source = makeProvince({
    number: 1,
    name: 'Alderpass',
    neighbors: [2, 3, 4],
    family,
    gold: SOURCE_GOLD,
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
  it('moves one Nerith visit without spending it or carrying another visit along', () => {
    const { source, neutral, command } = setup();
    const carried = new Nerith();
    const reserve = new Nerith();
    source.fifthUnits.addUnit(carried);
    source.fifthUnits.addUnit(reserve);
    command.moveTo(neutral, {});
    command.carry(carried);
    command.execute();

    expect(source.fifthUnits.units).toEqual([reserve]);
    expect(neutral.fifthUnits.units).toEqual([carried]);
    expect(neutral.belongsTo(source.family!)).toBe(true);
    expect(source.fifthUnits.hiredUnits).toEqual([]);
  });

  it('reinforces an adjacent province you own without changing its ownership', () => {
    const { family, source, owned, command } = setup();

    command.moveTo(owned, { gold: 40, food: 30, troops: 60 });
    command.execute();

    expect(source.resources.gold).toBe(SOURCE_GOLD - 40);
    expect(source.resources.troops).toBe(SOURCE_TROOPS - 60);
    expect(source.resources.food).toBe(SOURCE_FOOD - 30);
    expect(owned.resources.gold).toBe(40);
    expect(owned.resources.troops).toBe(60);
    expect(owned.resources.food).toBe(30);
    expect(owned.belongsTo(family)).toBe(true);
    expect(owned.governor).toBeUndefined();
    expect(source.goodwill).toBe(0);
    expect(source.actionCount).toBe(1);
  });

  it('claims an adjacent neutral province, ruled remotely by the ruler', () => {
    const { ruler, family, neutral, command } = setup();

    command.moveTo(neutral, { gold: 40, food: 30, troops: 60 });
    command.execute();

    expect(neutral.belongsTo(family)).toBe(true);
    expect(neutral.ruledBy(ruler)).toBe(true);
    expect(neutral.isRemotelyRuled).toBe(true);
    expect(neutral.resources.gold).toBe(40);
    expect(neutral.resources.troops).toBe(60);
    expect(neutral.resources.food).toBe(30);
  });

  it('offers adjacent provinces you own or that are neutral only', () => {
    const { command } = setup();

    expect([...command.selectableTargets].sort()).toEqual([2, 3]);
  });

  it('carries a stationed unit to a province you own, leaving the rest', () => {
    const { source, owned, command } = setup();
    source.fifthUnits.addUnit(HiredUnit.ofName('Grimhides')!);
    source.fifthUnits.addUnit(HiredUnit.ofName('Bugbear')!);

    command.moveTo(owned, { troops: 10 });
    command.carry(source.fifthUnits.hiredUnits[0]);
    command.execute();

    expect(owned.fifthUnits.hiredUnits.map((unit) => unit.name)).toEqual([
      'Grimhides',
    ]);
    expect(source.fifthUnits.hiredUnits.map((unit) => unit.name)).toEqual([
      'Bugbear',
    ]);
  });

  it('relocates a carried unit even when no resources move', () => {
    const { source, owned, command } = setup();
    source.fifthUnits.addUnit(HiredUnit.ofName('Grimhides')!);

    command.moveTo(owned, {});
    command.carry(source.fifthUnits.hiredUnits[0]);
    command.execute();

    expect(owned.fifthUnits.hiredUnits.map((unit) => unit.name)).toEqual([
      'Grimhides',
    ]);
    expect(source.fifthUnits.hiredUnits).toHaveLength(0);
  });

  it('carries a unit into a freshly claimed neutral province', () => {
    const { family, neutral, source, command } = setup();
    source.fifthUnits.addUnit(HiredUnit.ofName('Grimhides')!);

    command.moveTo(neutral, { troops: 10 });
    command.carry(source.fifthUnits.hiredUnits[0]);
    command.execute();

    expect(neutral.belongsTo(family)).toBe(true);
    expect(neutral.fifthUnits.hiredUnits.map((unit) => unit.name)).toEqual([
      'Grimhides',
    ]);
  });

  it('allows a carried unit to join a destination already stationing its type', () => {
    const { source, owned, command } = setup();
    source.fifthUnits.addUnit(HiredUnit.ofName('Grimhides')!);
    owned.fifthUnits.addUnit(HiredUnit.ofName('Grimhides')!);

    command.moveTo(owned, { troops: 10 });
    command.carry(source.fifthUnits.hiredUnits[0]);
    command.execute();

    expect(owned.fifthUnits.hiredUnits.map((unit) => unit.name)).toEqual([
      'Grimhides',
      'Grimhides',
    ]);
    expect(source.fifthUnits.hiredUnits).toHaveLength(0);
  });
});
