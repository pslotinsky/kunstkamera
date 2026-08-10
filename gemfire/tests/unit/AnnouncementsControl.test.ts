// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';
import { UnitDesertedEvent } from '@/core/events/UnitDesertedEvent';
import styles from '@/ui/Announcements/Announcements.module.scss';
import { AnnouncementsControl } from '@/ui/Announcements/AnnouncementsControl';

import { makeFamily, makeProvince, makeWorld } from './factories';

function setup() {
  const mine = makeFamily({ name: 'Blanche' });
  const theirs = makeFamily({ name: 'Fitzroy' });
  const myProvince = makeProvince({
    number: 1,
    name: 'Lorraine',
    family: mine,
  });
  const theirProvince = makeProvince({
    number: 2,
    name: 'Anjou',
    family: theirs,
  });
  const { world, events } = makeWorld([myProvince, theirProvince], mine);
  const container = document.createElement('div');

  new AnnouncementsControl({ world, events }).mount(container);

  const root = container.querySelector<HTMLElement>(`.${styles.root}`)!;

  return {
    myProvince,
    theirProvince,
    desert: (province: Province, type: string) =>
      events.publish(
        new UnitDesertedEvent(province, HiredUnit.ofType(type)!, 'faithless'),
      ),
    continue: () => root.querySelector('button')!.click(),
    shown: () => !root.classList.contains(styles.hidden!),
    text: () => root.querySelector('[data-text]')!.textContent,
    pending: () => root.querySelector('[data-pending]')!.textContent,
  };
}

describe('AnnouncementsControl', () => {
  it('announces only what happens in your own provinces', () => {
    const screen = setup();

    screen.desert(screen.theirProvince, 'Warriors');

    expect(screen.shown()).toBe(false);

    screen.desert(screen.myProvince, 'Spearmen');

    expect(screen.shown()).toBe(true);
    expect(screen.text()).toContain('Spearmen');
    expect(screen.text()).toContain('Lorraine');
  });

  it('holds announcements in a queue until each is dismissed', () => {
    const screen = setup();

    screen.desert(screen.myProvince, 'Spearmen');
    screen.desert(screen.myProvince, 'Pikemen');

    expect(screen.text()).toContain('Spearmen');
    expect(screen.pending()).toBe('1 more to come');

    screen.continue();

    expect(screen.text()).toContain('Pikemen');
    expect(screen.pending()).toBe('');

    screen.continue();

    expect(screen.shown()).toBe(false);
  });
});
