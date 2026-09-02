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
  const ruler = makeGeneral({ name: 'Erin', intelligence: RULER_INTELLIGENCE });
  const karl = makeGeneral({ name: 'Karl' });
  const anselm = makeGeneral({ name: 'Anselm' });
  const family = makeFamily({
    name: 'Blanche',
    ruler,
    members: [ruler, karl, anselm],
  });

  const home = makeProvince({ number: 1, family: family, governor: ruler });
  const byKarl = makeProvince({ number: 2, family: family, governor: karl });
  const byAnselm = makeProvince({
    number: 3,
    family: family,
    governor: anselm,
  });

  family.homeProvince = home;

  const { world, events } = makeWorld([home, byKarl, byAnselm], family);
  const command = new ChangeLordCommand({ world, events });

  advanceTo(world, home);

  return {
    ruler,
    karl,
    anselm,
    family,
    home,
    byKarl,
    byAnselm,
    world,
    command,
  };
}

describe('ChangeLordCommand', () => {
  it('swaps the two lords when the target already has one', () => {
    const { karl, anselm, family, byKarl, byAnselm, world, command } = setup();

    command.assignLord(byAnselm, karl);

    command.execute();

    expect(byAnselm.governor).toBe(karl);
    expect(byKarl.governor).toBe(anselm);
    expect(byKarl.isRemotelyRuled).toBe(false);
    expect(world.getVassals(family)).toEqual([]);
  });

  it('rules a province directly, ruler remote at half strength, no turn spent', () => {
    const { ruler, byKarl, command } = setup();

    command.ruleDirectly(byKarl);

    expect(command.consumesTurn()).toBe(false);

    command.execute();

    expect(byKarl.governor).toBe(ruler);
    expect(byKarl.isRemotelyRuled).toBe(true);
    expect(byKarl.actionCount).toBe(0);
  });

  it('is refused off the home province', () => {
    const { byKarl, home, world, command } = setup();

    advanceTo(world, byKarl);
    expect(command.canExecute()).toBe(false);

    advanceTo(world, home);
    expect(command.canExecute()).toBe(true);
  });
});
