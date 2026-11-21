import { afterEach, describe, expect, it, vi } from 'vitest';

import { CaptorPolicy } from '@/core/ai/CaptorPolicy';
import { CaptiveJudgedEvent } from '@/core/events/CaptiveJudgedEvent';

import {
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup(fame: number, charisma = 70) {
  const rhovan = makeGeneral({ name: 'Rhovan', recruitClass: 1 });
  const avar = makeGeneral({ name: 'Avar' });
  const player = makeFamily({
    name: 'Alderwyn',
    ruler: avar,
    members: [avar, rhovan],
  });
  const captor = makeFamily({
    name: 'Stormmere',
    ruler: makeGeneral({ charisma }),
    fame,
  });
  const { world, events } = makeWorld(
    [
      makeProvince({ number: 1, family: player, governor: avar }),
      makeProvince({ number: 2, family: captor }),
    ],
    player,
  );
  const captive = makeCaptive({ general: rhovan, house: player, captor });
  const policy = new CaptorPolicy({ world, events });
  const verdicts: CaptiveJudgedEvent[] = [];

  world.hold(captive);
  events.subscribe(CaptiveJudgedEvent, (event) => verdicts.push(event));

  const judge = (roll: number) => {
    vi.spyOn(Math, 'random').mockReturnValue(roll);

    policy.chooseJudgement(captive).execute();
  };

  return { world, rhovan, captor, verdicts, judge };
}

describe('CaptorPolicy', () => {
  afterEach(() => vi.restoreAllMocks());

  it('always recruits when the captor has enough Fame', () => {
    const { captor, rhovan, verdicts, judge } = setup(31);

    judge(0);

    expect(captor.members).toContain(rhovan);
    expect(verdicts[0]?.outcome).toBe('joined');
  });

  it('banishes an ineligible captive when the roll is below the CHA-based chance', () => {
    const { world, rhovan, judge } = setup(30);

    judge(0.09);

    expect(world.isExiled(rhovan)).toBe(true);
  });

  it.each([
    [70, 0.1],
    [101, 0],
  ])(
    'releases an ineligible captive with CHA %s and roll %s',
    (charisma, roll) => {
      const { world, rhovan, verdicts, judge } = setup(30, charisma);

      judge(roll);

      expect(verdicts[0]?.outcome).toBe('released');
      expect(world.isHeld(rhovan)).toBe(false);
    },
  );
});
