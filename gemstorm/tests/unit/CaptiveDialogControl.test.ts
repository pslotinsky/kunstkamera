// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { RansomCommand } from '@/core/commands/RansomCommand';
import type { Captive } from '@/core/domain/Captive';
import { BattleReportClosedEvent } from '@/ui/screens/StrategyScreen/BattleReport/BattleReportClosedEvent';
import styles from '@/ui/screens/StrategyScreen/CaptiveDialog/CaptiveDialog.module.scss';
import { CaptiveDialogControl } from '@/ui/screens/StrategyScreen/CaptiveDialog/CaptiveDialogControl';

import {
  makeCaptive,
  makeFamily,
  makeGeneral,
  makeProvince,
  makeWorld,
} from './factories';

function setup(fame = 100) {
  const avar = makeGeneral({ name: 'Avar' });
  const wintercairn = makeProvince({ number: 5, gold: 216 });
  const mine = makeFamily({
    name: 'Alderwyn',
    ruler: avar,
    homeProvince: wintercairn,
    fame,
  });
  const darian = makeGeneral({ name: 'Darian' });
  const marven = makeGeneral({ name: 'Marven', war: 77, recruitClass: 1 });
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
  it('asks for a currency before judgement and pays an accepted demand into the battlefield', () => {
    const {
      open,
      choice,
      title,
      mine,
      rival,
      marven,
      world,
      wintercairn,
      pineward,
    } = setup();
    const captive = makeCaptive({
      general: marven,
      house: rival,
      captor: mine,
      battlefield: wintercairn,
      pendingRansom: true,
    });

    open(captive);

    expect(choice('Recruit')).toBeNull();
    expect(choice('Demand 60 Food')).not.toBeNull();
    choice('Demand 35 Gold')!.click();

    expect(pineward.resources.gold).toBe(265);
    expect(wintercairn.resources.gold).toBe(251);
    expect(world.isHeld(marven)).toBe(false);
    expect(title()).toBe('Marven returns to court after payment');
  });

  it('moves on to the judgement when a demand is refused', () => {
    const { open, choice, title, mine, rival, marven, world } = setup();
    const captive = makeCaptive({
      general: marven,
      house: rival,
      captor: mine,
      pendingRansom: true,
    });

    open(captive);
    choice('Demand 60 Food')!.click();

    expect(choice('Recruit')?.disabled).toBe(false);
    expect(world.isHeld(marven)).toBe(true);
    expect(title()).toBe('Stormmere refused the ransom');
  });

  it('lets the player pay a computer demand from the home province', () => {
    const { choice, mine, rival, world, events, wintercairn, pineward } =
      setup();
    const captive = makeCaptive({
      house: mine,
      captor: rival,
      battlefield: pineward,
      pendingRansom: true,
    });
    const command = new RansomCommand({ world, events });

    world.hold(captive);
    command.demand(captive, 'gold');
    command.execute();
    events.publish(new BattleReportClosedEvent());

    expect(choice('Pay 30 Gold')?.disabled).toBe(false);
    choice('Pay 30 Gold')!.click();

    expect(wintercairn.resources.gold).toBe(186);
    expect(pineward.resources.gold).toBe(330);
    expect(world.isHeld(captive.general)).toBe(false);
  });

  it('disables unaffordable payments and lets the player refuse', () => {
    const { choice, isOpen, mine, rival, world, events } = setup();
    const captive = makeCaptive({
      house: mine,
      captor: rival,
      pendingRansom: true,
    });
    const command = new RansomCommand({ world, events });

    world.hold(captive);
    command.demand(captive, 'food');
    command.execute();
    events.publish(new BattleReportClosedEvent());

    expect(choice('Pay 50 Food')?.disabled).toBe(true);
    choice('Refuse')!.click();

    expect(isOpen()).toBe(false);
    expect(captive.ransom).toBeUndefined();
    expect(world.isHeld(captive.general)).toBe(true);
  });

  it('offers all three choices when recruitment is available', () => {
    const { open, choice, mine, rival, marven } = setup();

    open(makeCaptive({ general: marven, house: rival, captor: mine }));

    expect(choice('Recruit')?.disabled).toBe(false);
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

  it('disables Recruit when Fame is too low and keeps the prisoner held', () => {
    const { open, choice, world, mine, rival, marven } = setup(30);

    open(makeCaptive({ general: marven, house: rival, captor: mine }));
    choice('Recruit')!.click();

    expect(choice('Recruit')?.disabled).toBe(true);
    expect(choice('Release')?.disabled).toBe(false);
    expect(world.isHeld(marven)).toBe(true);
  });

  it('takes an eligible recruit into the house', () => {
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
