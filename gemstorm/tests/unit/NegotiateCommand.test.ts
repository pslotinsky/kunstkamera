import { afterEach, describe, expect, it, vi } from 'vitest';

import { NegotiateCommand } from '@/core/commands/province/NegotiateCommand';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';

import {
  advanceTo,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup() {
  const alderwyn = makeFamily({
    name: 'Alderwyn',
    ruler: makeGeneral({ charisma: 75 }),
  });
  const darian = makeGeneral({ name: 'Darian' });
  const marven = makeGeneral({ name: 'Marven' });
  const brennor = makeGeneral({ name: 'Brennor' });
  const stormmere = makeFamily({
    name: 'Stormmere',
    ruler: darian,
    members: [darian, marven, brennor],
  });

  const alderpass = makeProvince({ number: 1, family: alderwyn, gold: 100 });
  const outpost = makeProvince({ number: 3, family: alderwyn });
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
  alderwyn.moveHome(alderpass);

  const { world, events } = makeWorld(
    [alderpass, outpost, rimewatch, pineward, neutral],
    alderwyn,
  );

  advanceTo(world, alderpass);

  return {
    command: new NegotiateCommand({ world, events }),
    world,
    events,
    alderpass,
    outpost,
    stormmere,
    marven,
    brennor,
    rimewatch,
    pineward,
  };
}

describe('NegotiateCommand', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reaches every rival province, however far', () => {
    const { command } = setup();

    expect(command.selectableTargets).toEqual([20, 6]);
  });

  it('offers a province’s lord, and at a family’s home its vassals without land — never the ruler', () => {
    const { command, marven, brennor, rimewatch, pineward } = setup();

    expect(command.getCandidates(pineward)).toEqual([marven]);
    expect(command.getCandidates(rimewatch)).toEqual([brennor]);
  });

  it('spends the capital’s action on a failed offer but costs no Gold', () => {
    const { command, events, alderpass, marven } = setup();
    const reports: MissionReportedEvent[] = [];

    events.subscribe(MissionReportedEvent, (event) => reports.push(event));
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    command.persuade(marven);
    command.execute();

    expect(reports[0]?.outcome).toMatchObject({
      kind: 'defection',
      persuaded: false,
    });
    expect(alderpass.actionCount).toBe(1);
    expect(alderpass.resources.gold).toBe(100);
  });

  it('rejects defection from a province other than the capital', () => {
    const { command, world, outpost, pineward, marven, stormmere } = setup();

    advanceTo(world, outpost);
    command.persuade(marven);
    command.execute();

    expect(command.getCandidates(pineward)).toEqual([]);
    expect(outpost.actionCount).toBe(0);
    expect(pineward.family).toBe(stormmere);
  });
});
