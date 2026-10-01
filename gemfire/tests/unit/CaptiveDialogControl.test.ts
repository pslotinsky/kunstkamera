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
  const erin = makeGeneral({ name: 'Erin' });
  const petaria = makeProvince({ number: 5, gold: 216 });
  const mine = makeFamily({
    name: 'Blanche',
    ruler: erin,
    homeProvince: petaria,
  });
  const ander = makeGeneral({ name: 'Ander' });
  const seth = makeGeneral({ name: 'Seth', war: 77 });
  const hyland = makeProvince({ number: 6, gold: 300 });
  const rival = makeFamily({
    name: 'Lyle',
    ruler: ander,
    members: [ander, seth],
    homeProvince: hyland,
  });

  petaria.claim(mine);
  hyland.claim(rival);

  const { world, events } = makeWorld([petaria, hyland], mine);
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
    ander,
    seth,
    petaria,
    hyland,
  };
}

describe('CaptiveDialogControl', () => {
  it('offers the three choices for any prisoner', () => {
    const { open, choice, mine, rival, seth } = setup();

    open(makeCaptive({ general: seth, house: rival, captor: mine }));

    expect(choice('Recruit')).not.toBeNull();
    expect(choice('Release')).not.toBeNull();
    expect(choice('Banish')).not.toBeNull();
  });

  it('banishes a captive and says so', () => {
    const { open, choice, title, isOpen, world, mine, rival, seth } = setup();

    open(makeCaptive({ general: seth, house: rival, captor: mine }));
    choice('Banish')!.click();

    expect(world.isExiled(seth)).toBe(true);
    expect(world.findCaptiveOf(mine)).toBeUndefined();
    expect(title()).toBe('Seth is banished from Ishmeria');
    expect(isOpen()).toBe(true);
  });

  it('shuts when the outcome is closed', () => {
    const { open, choice, isOpen, mine, rival, seth } = setup();

    open(makeCaptive({ general: seth, house: rival, captor: mine }));
    choice('Banish')!.click();
    choice('Close')!.click();

    expect(isOpen()).toBe(false);
  });

  it('says when a recruit refuses to turn', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    const { open, choice, title, mine, rival, seth } = setup();

    open(makeCaptive({ general: seth, house: rival, captor: mine }));
    choice('Recruit')!.click();

    expect(title()).toBe('Seth refuses to join you');
  });

  it('takes a recruit into the house when he agrees', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);

    const { open, choice, title, mine, rival, seth } = setup();

    open(makeCaptive({ general: seth, house: rival, captor: mine }));
    choice('Recruit')!.click();

    expect(mine.members).toContain(seth);
    expect(title()).toBe('Seth joins your house');
  });

  it('stays shut when nobody is held', () => {
    const { choice, events } = setup();

    events.publish(new BattleReportClosedEvent());

    expect(choice('Recruit')).toBeNull();
  });
});
