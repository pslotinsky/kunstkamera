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
  const blanche = makeFamily({ name: 'Blanche' });
  const ander = makeGeneral({ name: 'Ander' });
  const seth = makeGeneral({ name: 'Seth' });
  const kneulf = makeGeneral({ name: 'Kneulf' });
  const lyle = makeFamily({
    name: 'Lyle',
    ruler: ander,
    members: [ander, seth, kneulf],
  });

  const rodale = makeProvince({ number: 1, family: blanche });
  const carveti = makeProvince({
    number: 20,
    family: lyle,
    governor: ander,
  });
  const hyland = makeProvince({ number: 6, family: lyle, governor: seth });
  const neutral = makeProvince({ number: 9 });

  lyle.moveHome(carveti);

  const { world, events } = makeWorld(
    [rodale, carveti, hyland, neutral],
    blanche,
  );

  advanceTo(world, rodale);

  return {
    command: new NegotiateCommand({ world, events }),
    seth,
    kneulf,
    carveti,
    hyland,
  };
}

describe('NegotiateCommand', () => {
  it('reaches every rival province, however far', () => {
    const { command } = setup();

    expect(command.selectableTargets).toEqual([20, 6]);
  });

  it('offers a province’s lord, and at a family’s home its vassals without land — never the ruler', () => {
    const { command, seth, kneulf, carveti, hyland } = setup();

    expect(command.getCandidates(hyland)).toEqual([seth]);
    expect(command.getCandidates(carveti)).toEqual([kneulf]);
  });
});
