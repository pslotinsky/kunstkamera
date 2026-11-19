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
  const avar = makeGeneral({ name: 'Avar' });
  const rhovan = makeGeneral({ name: 'Rhovan' });
  const alderwyn = makeFamily({
    name: 'Alderwyn',
    ruler: avar,
    members: [avar, rhovan],
  });
  const home = makeProvince({ number: 1, family: alderwyn, governor: avar });
  const lorded = makeProvince({
    number: 2,
    family: alderwyn,
    governor: rhovan,
  });
  const manor = makeProvince({ number: 3, family: alderwyn, governor: avar });

  alderwyn.moveHome(home);

  const { world, events } = makeWorld([home, lorded, manor], alderwyn);
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
