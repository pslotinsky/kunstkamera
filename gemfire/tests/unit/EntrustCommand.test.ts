import { describe, expect, it } from 'vitest';

import { EntrustCommand } from '@/core/commands/province/EntrustCommand';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup() {
  const erin = makeGeneral({ name: 'Erin' });
  const pender = makeGeneral({ name: 'Pender' });
  const blanche = makeFamily({
    name: 'Blanche',
    ruler: erin,
    members: [erin, pender],
  });
  const home = makeProvince({ number: 1, family: blanche, governor: erin });
  const lorded = makeProvince({ number: 2, family: blanche, governor: pender });
  const manor = makeProvince({ number: 3, family: blanche, governor: erin });

  blanche.moveHome(home);

  const { world, events } = makeWorld([home, lorded, manor], blanche);
  const command = new EntrustCommand({ world, events });

  advanceTo(world, home);

  return { world, command, home, lorded };
}

describe('EntrustCommand', () => {
  it('hands only lorded provinces to their lords, from the home province', () => {
    const { world, command, lorded } = setup();

    expect(command.selectableTargets).toEqual([2]);
    expect(command.consumesTurn()).toBe(false);

    advanceTo(world, lorded);

    expect(command.selectableTargets).toEqual([]);
  });

  it('entrusts a province and takes it back again', () => {
    const { command, lorded } = setup();

    command.entrust(lorded);
    command.execute();

    expect(lorded.isEntrusted).toBe(true);

    command.cancel(lorded);
    command.execute();

    expect(lorded.isEntrusted).toBe(false);
  });
});
