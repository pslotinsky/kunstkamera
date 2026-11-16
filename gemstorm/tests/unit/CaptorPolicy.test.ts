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

function setup() {
  const rhovan = makeGeneral({ name: 'Rhovan' });
  const avar = makeGeneral({ name: 'Avar' });
  const player = makeFamily({
    name: 'Alderwyn',
    ruler: avar,
    members: [avar, rhovan],
  });
  const captor = makeFamily({ name: 'Stormmere' });
  const { world, events } = makeWorld(
    [
      makeProvince({ number: 1, family: player, governor: avar }),
      makeProvince({ number: 2, family: captor }),
    ],
    player,
  );
  const captive = makeCaptive({ general: rhovan, house: player, captor });
  const verdicts: CaptiveJudgedEvent[] = [];

  world.hold(captive);
  events.subscribe(CaptiveJudgedEvent, (event) => verdicts.push(event));

  const judge = (roll: number) => {
    vi.spyOn(Math, 'random').mockReturnValue(roll);

    for (const judgement of new CaptorPolicy({
      world,
      events,
    }).chooseJudgements(captor)) {
      judgement.execute();
    }
  };

  return { world, rhovan, captor, verdicts, judge };
}

describe('CaptorPolicy', () => {
  afterEach(() => vi.restoreAllMocks());

  it('tries to recruit a captive and sets him free when he refuses', () => {
    const joined = setup();
    const refused = setup();

    joined.judge(0.3);
    refused.judge(0.9);

    expect(joined.captor.members).toContain(joined.rhovan);
    expect(refused.verdicts[0]?.outcome).toBe('refused');
    expect(refused.world.isHeld(refused.rhovan)).toBe(false);
  });

  it('banishes only on the rare roll', () => {
    const { world, rhovan, judge } = setup();

    judge(0.01);

    expect(world.isExiled(rhovan)).toBe(true);
  });
});
