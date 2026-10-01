// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import type { Captive } from '@/core/domain/Captive';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { BattleReportControl } from '@/ui/BattleReport/BattleReportControl';

import {
  makeArmy,
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeInvasionReport,
  makeProvince,
  makeWorld,
} from './factories';

function setup() {
  const erin = makeGeneral({ name: 'Erin' });
  const mine = makeFamily({ name: 'Blanche', ruler: erin });
  const seth = makeGeneral({ name: 'Seth' });
  const rival = makeFamily({ name: 'Lyle', ruler: seth });
  const home = makeProvince({ number: 1, family: mine, governor: erin });
  const target = makeProvince({ number: 22, family: rival, governor: seth });
  const { world, events } = makeWorld([home, target], mine);

  function show(captive?: Captive): HTMLElement {
    const container = document.createElement('div');
    const control = new BattleReportControl({ world, events });
    const report = makeInvasionReport({
      target,
      attacker: makeArmy({ commander: erin }),
      defender: makeArmy({ commander: seth }),
    });

    report.captive = captive;
    control.mount(container);
    events.publish(new BattleReportedEvent(report));

    return container.querySelector<HTMLElement>('[data-capture]')!;
  }

  return { show, mine, rival, erin, seth };
}

describe('BattleReportControl', () => {
  it('names a commander you have taken', () => {
    const { show, mine, rival, seth } = setup();
    const line = show(
      makeCaptive({ general: seth, house: rival, captor: mine }),
    );

    expect(line.textContent).toBe('Seth of Lyle is your prisoner.');
  });

  it('names a commander the enemy has taken from you', () => {
    const { show, mine, rival, erin } = setup();
    const line = show(
      makeCaptive({ general: erin, house: mine, captor: rival }),
    );

    expect(line.textContent).toBe('Erin is taken by Lyle.');
  });

  it('says nothing when no one was taken', () => {
    const { show } = setup();

    expect(show().textContent).toBe('');
  });
});
