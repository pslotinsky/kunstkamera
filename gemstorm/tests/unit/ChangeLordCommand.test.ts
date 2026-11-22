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

  const remote = makeProvince({ number: 4, family, governor: ruler });
  const foreign = makeProvince({ number: 5, family: makeFamily() });
  const { world, events } = makeWorld(
    [home, byBeran, byNemer, remote, foreign],
    family,
  );
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
    remote,
    foreign,
    world,
    command,
  };
}

describe('ChangeLordCommand', () => {
  it('swaps the two lords when the target already has one', () => {
    const { beran, nemer, family, byBeran, byNemer, world, command } = setup();

    command.swapGovernors(byNemer, byBeran);

    expect(command.consumesTurn()).toBe(false);
    command.execute();

    expect(byNemer.governor).toBe(beran);
    expect(byBeran.governor).toBe(nemer);
    expect(byBeran.isRemotelyRuled).toBe(false);
    expect(world.getVassals(family)).toEqual([]);
  });

  it('rules a province directly, ruler remote at half strength, no turn spent', () => {
    const { ruler, byBeran, command } = setup();

    byBeran.entrust();
    command.ruleDirectly(byBeran);

    expect(command.consumesTurn()).toBe(false);

    command.execute();

    expect(byBeran.governor).toBe(ruler);
    expect(byBeran.isRemotelyRuled).toBe(true);
    expect(byBeran.actionCount).toBe(0);
    expect(byBeran.isEntrusted).toBe(false);
  });

  it('swaps a lord with an empty province and preserves entrustment', () => {
    const { ruler, beran, byBeran, remote, command } = setup();
    byBeran.entrust();

    command.swapGovernors(remote, byBeran);
    command.execute();

    expect(remote.governor).toBe(beran);
    expect(byBeran.governor).toBe(ruler);
    expect(byBeran.isEntrusted).toBe(true);
  });

  it('replaces a lord with a vassal, keeps Entrust, and returns the displaced lord to court', () => {
    const { beran, nemer, family, byBeran, byNemer, world, command } = setup();
    command.ruleDirectly(byBeran);
    command.execute();
    byNemer.entrust();

    command.assignLord(byNemer, beran);
    command.execute();

    expect(byNemer.governor).toBe(beran);
    expect(byNemer.isEntrusted).toBe(true);
    expect(world.getVassals(family)).toEqual([nemer]);
  });

  it('moves the ruler and court, consuming the old home province’s turn', () => {
    const { ruler, beran, family, home, byBeran, byNemer, world, command } =
      setup();
    command.ruleDirectly(byNemer);
    command.execute();
    byBeran.entrust();

    command.swapGovernors(byBeran, home);
    expect(command.consumesTurn()).toBe(true);
    command.execute();

    expect(family.homeProvince).toBe(byBeran);
    expect(byBeran.governor).toBe(ruler);
    expect(byBeran.isEntrusted).toBe(false);
    expect(home.governor).toBe(beran);
    expect(world.getResidence(family, world.getVassals(family)[0]!)).toBe(
      byBeran,
    );
    expect(home.actionCount).toBe(1);
    expect(home.goodwill).toBe(0);
  });

  it('rejects reassignment across house boundaries', () => {
    const { beran, byBeran, foreign, command } = setup();

    command.swapGovernors(foreign, byBeran);
    command.execute();

    expect(foreign.governor).toBeUndefined();
    expect(byBeran.governor).toBe(beran);
  });

  it('is refused off the home province', () => {
    const { byBeran, home, world, command } = setup();

    advanceTo(world, byBeran);
    expect(command.canExecute()).toBe(false);

    advanceTo(world, home);
    expect(command.canExecute()).toBe(true);
  });
});
