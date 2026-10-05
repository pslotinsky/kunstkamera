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
  const pender = makeGeneral({ name: 'Pender' });
  const erin = makeGeneral({ name: 'Erin' });
  const player = makeFamily({
    name: 'Blanche',
    ruler: erin,
    members: [erin, pender],
  });
  const captor = makeFamily({ name: 'Lyle' });
  const { world, events } = makeWorld(
    [
      makeProvince({ number: 1, family: player, governor: erin }),
      makeProvince({ number: 2, family: captor }),
    ],
    player,
  );
  const captive = makeCaptive({ general: pender, house: player, captor });
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

  return { world, pender, captor, verdicts, judge };
}

describe('CaptorPolicy', () => {
  afterEach(() => vi.restoreAllMocks());

  it('tries to recruit a captive and sets him free when he refuses', () => {
    const joined = setup();
    const refused = setup();

    joined.judge(0.3);
    refused.judge(0.9);

    expect(joined.captor.members).toContain(joined.pender);
    expect(refused.verdicts[0]?.outcome).toBe('refused');
    expect(refused.world.isHeld(refused.pender)).toBe(false);
  });

  it('banishes only on the rare roll', () => {
    const { world, pender, judge } = setup();

    judge(0.01);

    expect(world.isExiled(pender)).toBe(true);
  });
});
