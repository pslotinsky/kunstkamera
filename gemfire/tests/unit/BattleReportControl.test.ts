// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import type { BattleOutcome } from '@/core/domain/BattleOutcome';
import { BattleSide } from '@/core/domain/BattleSide';
import type { Captive } from '@/core/domain/Captive';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import styles from '@/ui/BattleReport/BattleReport.module.scss';
import { BattleReportControl } from '@/ui/BattleReport/BattleReportControl';
import { SoundBoard } from '@/ui/sound/SoundBoard';

import {
  makeArmy,
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeInvasionReport,
  makeOutcome,
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
  const sounds = new SoundBoard();

  function show(
    captive?: Captive,
    outcome: BattleOutcome = makeOutcome(),
  ): HTMLElement {
    const container = document.createElement('div');
    const control = new BattleReportControl({ world, events, sounds });
    const report = makeInvasionReport({
      source: home,
      target,
      attacker: makeArmy({ commander: erin }),
      defender: makeArmy({ commander: seth }),
      outcome,
    });

    report.captive = captive;
    control.mount(container);
    events.publish(new BattleReportedEvent(report));

    return container;
  }

  function showWar(): { root: HTMLElement; ended: TurnEndedEvent[] } {
    const container = document.createElement('div');
    const control = new BattleReportControl({ world, events, sounds });
    const ended: TurnEndedEvent[] = [];
    const camp = makeProvince({ number: 7, family: rival, governor: seth });
    const coryll = makeFamily({ name: 'Coryll' });
    const taken = makeProvince({ number: 8, name: 'Hyland', family: rival });

    events.subscribe(TurnEndedEvent, (event) => ended.push(event));
    control.mount(container);
    control.showWar(
      makeInvasionReport({
        source: camp,
        target: taken,
        defending: coryll,
        attacker: makeArmy({ commander: seth }),
      }),
    );

    return { root: container, ended };
  }

  return { show, showWar, sounds, mine, rival, erin, seth };
}

function getCaptureLine(root: HTMLElement): string | null {
  return root.querySelector('[data-capture]')!.textContent;
}

function isSidesShown(root: HTMLElement): boolean {
  return !root
    .querySelector('[data-sides]')!
    .classList.contains(styles.hidden!);
}

describe('BattleReportControl', () => {
  it('names a commander you have taken', () => {
    const { show, mine, rival, seth } = setup();
    const root = show(
      makeCaptive({ general: seth, house: rival, captor: mine }),
    );

    expect(getCaptureLine(root)).toBe('Seth of Lyle is your prisoner.');
  });

  it('names a commander the enemy has taken from you', () => {
    const { show, mine, rival, erin } = setup();
    const root = show(
      makeCaptive({ general: erin, house: mine, captor: rival }),
    );

    expect(getCaptureLine(root)).toBe('Erin is taken by Lyle.');
  });

  it('says nothing when no one was taken', () => {
    const { show } = setup();

    expect(getCaptureLine(show())).toBe('');
  });

  it('tells a rival war from the side of its winner', () => {
    const { showWar } = setup();
    const { root } = showWar();

    expect(root.querySelector('[data-war]')!.textContent).toBe(
      'Lyle attacks Hyland, held by Coryll.',
    );
    expect(root.querySelector('[data-verdict]')!.textContent).toBe(
      'Hyland falls to Lyle. Seth holds it.',
    );
  });

  it('shows the troops of each side only in a war you fight', () => {
    const { show, showWar } = setup();

    expect(isSidesShown(show())).toBe(true);
    expect(isSidesShown(showWar().root)).toBe(false);
  });

  it('plays the fanfare when your won war is reported', () => {
    const { show, sounds } = setup();
    const fanfare = vi.spyOn(sounds, 'playFanfare');

    show();

    expect(fanfare).toHaveBeenCalledOnce();
  });

  it('plays the dirge when your lost war is reported', () => {
    const { show, sounds } = setup();
    const dirge = vi.spyOn(sounds, 'playDirge');

    show(undefined, makeOutcome({ winner: BattleSide.defender }));

    expect(dirge).toHaveBeenCalledOnce();
  });

  it('keeps silent over a rival war report', () => {
    const { showWar, sounds } = setup();
    const fanfare = vi.spyOn(sounds, 'playFanfare');
    const dirge = vi.spyOn(sounds, 'playDirge');

    showWar();

    expect(fanfare).not.toHaveBeenCalled();
    expect(dirge).not.toHaveBeenCalled();
  });

  it('ends the rival turn when its war report is closed', () => {
    const { showWar } = setup();
    const { root, ended } = showWar();

    root.querySelector<HTMLButtonElement>('button')!.click();

    expect(ended).toHaveLength(1);
  });
});
