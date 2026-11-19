import { describe, expect, it } from 'vitest';

import { NegotiateCommand } from '@/core/commands/province/NegotiateCommand';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup() {
  const alderwyn = makeFamily({ name: 'Alderwyn' });
  const darian = makeGeneral({ name: 'Darian' });
  const marven = makeGeneral({ name: 'Marven' });
  const brennor = makeGeneral({ name: 'Brennor' });
  const stormmere = makeFamily({
    name: 'Stormmere',
    ruler: darian,
    members: [darian, marven, brennor],
  });

  const alderpass = makeProvince({ number: 1, family: alderwyn });
  const rimewatch = makeProvince({
    number: 20,
    family: stormmere,
    governor: darian,
  });
  const pineward = makeProvince({
    number: 6,
    family: stormmere,
    governor: marven,
  });
  const neutral = makeProvince({ number: 9 });

  stormmere.moveHome(rimewatch);

  const { world, events } = makeWorld(
    [alderpass, rimewatch, pineward, neutral],
    alderwyn,
  );

  advanceTo(world, alderpass);

  return {
    command: new NegotiateCommand({ world, events }),
    marven,
    brennor,
    rimewatch,
    pineward,
  };
}

describe('NegotiateCommand', () => {
  it('reaches every rival province, however far', () => {
    const { command } = setup();

    expect(command.selectableTargets).toEqual([20, 6]);
  });

  it('offers a province’s lord, and at a family’s home its vassals without land — never the ruler', () => {
    const { command, marven, brennor, rimewatch, pineward } = setup();

    expect(command.getCandidates(pineward)).toEqual([marven]);
    expect(command.getCandidates(rimewatch)).toEqual([brennor]);
  });
});
