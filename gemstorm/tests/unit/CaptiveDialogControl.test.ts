// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import type { Captive } from '@/core/domain/Captive';
import { BattleReportClosedEvent } from '@/ui/BattleReport/BattleReportClosedEvent';
import styles from '@/ui/CaptiveDialog/CaptiveDialog.module.scss';
import { CaptiveDialogControl } from '@/ui/CaptiveDialog/CaptiveDialogControl';

import {
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup() {
  const avar = makeGeneral({ name: 'Avar' });
  const wintercairn = makeProvince({ number: 5, gold: 216 });
  const mine = makeFamily({
    name: 'Alderwyn',
    ruler: avar,
    homeProvince: wintercairn,
  });
  const darian = makeGeneral({ name: 'Darian' });
  const marven = makeGeneral({ name: 'Marven', war: 77 });
  const pineward = makeProvince({ number: 6, gold: 300 });
  const rival = makeFamily({
    name: 'Stormmere',
    ruler: darian,
    members: [darian, marven],
    homeProvince: pineward,
  });

  wintercairn.claim(mine);
  pineward.claim(rival);

  const { world, events } = makeWorld([wintercairn, pineward], mine);
  const container = document.createElement('div');
  const control = new CaptiveDialogControl({ world, events });

  control.mount(container);

  function open(captive: Captive): void {
    world.hold(captive);
    events.publish(new BattleReportClosedEvent());
  }

  const isOpen = () =>
    !container
      .querySelector<HTMLElement>('section')!
      .classList.contains(styles.hidden!);

  const title = () =>
    container.querySelector<HTMLElement>('[data-title]')!.textContent;

  const choice = (label: string) =>
    container.querySelector<HTMLButtonElement>(`[data-choice^="${label}"]`);

  return {
    open,
    choice,
    title,
    isOpen,
    events,
    world,
    mine,
    rival,
    darian,
    marven,
    wintercairn,
    pineward,
  };
}

describe('CaptiveDialogControl', () => {
  it('offers the three choices for any prisoner', () => {
    const { open, choice, mine, rival, marven } = setup();

    open(makeCaptive({ general: marven, house: rival, captor: mine }));

    expect(choice('Recruit')).not.toBeNull();
    expect(choice('Release')).not.toBeNull();
    expect(choice('Banish')).not.toBeNull();
  });

  it('banishes a captive and says so', () => {
    const { open, choice, title, isOpen, world, mine, rival, marven } = setup();

    open(makeCaptive({ general: marven, house: rival, captor: mine }));
    choice('Banish')!.click();

    expect(world.isExiled(marven)).toBe(true);
    expect(world.findCaptiveOf(mine)).toBeUndefined();
    expect(title()).toBe('Marven is banished from Aureth');
    expect(isOpen()).toBe(true);
  });

  it('shuts when the outcome is closed', () => {
    const { open, choice, isOpen, mine, rival, marven } = setup();

    open(makeCaptive({ general: marven, house: rival, captor: mine }));
    choice('Banish')!.click();
    choice('Close')!.click();

    expect(isOpen()).toBe(false);
  });

  it('says when a recruit refuses to turn', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const { open, choice, title, mine, rival, marven } = setup();

    open(makeCaptive({ general: marven, house: rival, captor: mine }));
    choice('Recruit')!.click();

    expect(title()).toBe('Marven refuses to join you');
  });

  it('takes a recruit into the house when he agrees', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const { open, choice, title, mine, rival, marven } = setup();

    open(makeCaptive({ general: marven, house: rival, captor: mine }));
    choice('Recruit')!.click();

    expect(mine.members).toContain(marven);
    expect(title()).toBe('Marven joins your house');
  });

  it('stays shut when nobody is held', () => {
    const { choice, events } = setup();

    events.publish(new BattleReportClosedEvent());

    expect(choice('Recruit')).toBeNull();
  });
});
