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
  const empty = makeProvince({ number: 4, family: alderwyn });

  alderwyn.moveHome(home);

  const { world, events } = makeWorld([home, lorded, manor, empty], alderwyn);
  const command = new EntrustCommand({ world, events });

  advanceTo(world, home);

  return { world, command, home, lorded, empty };
}

describe('EntrustCommand', () => {
  it('offers every own province but the ruler’s, from any own province', () => {
    const { world, command, lorded } = setup();

    expect(command.selectableTargets).toEqual([2, 3, 4]);
    expect(command.consumesTurn()).toBe(false);

    advanceTo(world, lorded);

    expect(command.selectableTargets).toEqual([2, 3, 4]);
  });

  it('entrusts a province with no general from a province that is not the capital', () => {
    const { world, command, lorded, empty } = setup();
    advanceTo(world, lorded);

    command.entrust(empty);
    command.execute();

    expect(empty.isEntrusted).toBe(true);
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

  it('toggles as often as wanted without spending the turn', () => {
    const { world, command, lorded } = setup();
    const turn = world.turnQueue.current!;

    command.entrust(lorded);
    command.execute();
    command.cancel(lorded);
    command.execute();
    command.entrust(lorded);
    command.execute();

    expect(lorded.isEntrusted).toBe(true);
    expect(turn.actionCount).toBe(0);
  });
});
