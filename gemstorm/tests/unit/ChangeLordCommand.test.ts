import { describe, expect, it } from 'vitest';

import { ChangeLordCommand } from '@/core/commands/province/ChangeLordCommand';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

const RULER_INTELLIGENCE = 82;

function setup() {
  const ruler = makeGeneral({ name: 'Avar', intelligence: RULER_INTELLIGENCE });
  const beran = makeGeneral({ name: 'Beran' });
  const nemer = makeGeneral({ name: 'Nemer' });
  const family = makeFamily({
    name: 'Alderwyn',
    ruler,
    members: [ruler, beran, nemer],
  });

  const home = makeProvince({ number: 1, family: family, governor: ruler });
  const byBeran = makeProvince({ number: 2, family: family, governor: beran });
  const byNemer = makeProvince({
    number: 3,
    family: family,
    governor: nemer,
  });

  family.homeProvince = home;

  const { world, events } = makeWorld([home, byBeran, byNemer], family);
  const command = new ChangeLordCommand({ world, events });

  advanceTo(world, home);

  return {
    ruler,
    beran,
    nemer,
    family,
    home,
    byBeran,
    byNemer,
    world,
    command,
  };
}

describe('ChangeLordCommand', () => {
  it('swaps the two lords when the target already has one', () => {
    const { beran, nemer, family, byBeran, byNemer, world, command } = setup();

    command.assignLord(byNemer, beran);

    command.execute();

    expect(byNemer.governor).toBe(beran);
    expect(byBeran.governor).toBe(nemer);
    expect(byBeran.isRemotelyRuled).toBe(false);
    expect(world.getVassals(family)).toEqual([]);
  });

  it('rules a province directly, ruler remote at half strength, no turn spent', () => {
    const { ruler, byBeran, command } = setup();

    command.ruleDirectly(byBeran);

    expect(command.consumesTurn()).toBe(false);

    command.execute();

    expect(byBeran.governor).toBe(ruler);
    expect(byBeran.isRemotelyRuled).toBe(true);
    expect(byBeran.actionCount).toBe(0);
  });

  it('is refused off the home province', () => {
    const { byBeran, home, world, command } = setup();

    advanceTo(world, byBeran);
    expect(command.canExecute()).toBe(false);

    advanceTo(world, home);
    expect(command.canExecute()).toBe(true);
  });
});
