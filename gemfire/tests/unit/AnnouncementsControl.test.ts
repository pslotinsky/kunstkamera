// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { Artifact } from '@/core/domain/Artifact';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { UnitDesertedEvent } from '@/core/events/UnitDesertedEvent';
import styles from '@/ui/Announcements/Announcements.module.scss';
import { AnnouncementsControl } from '@/ui/Announcements/AnnouncementsControl';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

const SWORD_OF_FIRE = new Artifact({
  name: 'Sword of Fire',
  characteristic: 'war',
  bonus: 30,
});

function setup() {
  const ruler = makeGeneral({ name: 'Erin', war: 50 });
  const vassal = makeGeneral({ name: 'Pender', war: 50 });
  const mine = makeFamily({
    name: 'Blanche',
    ruler,
    members: [ruler, vassal],
  });
  const theirs = makeFamily({ name: 'Fitzroy' });
  const myProvince = makeProvince({
    number: 1,
    name: 'Lorraine',
    family: mine,
    governor: ruler,
  });
  const theirProvince = makeProvince({
    number: 2,
    name: 'Anjou',
    family: theirs,
  });
  const { world, events } = makeWorld([myProvince, theirProvince], mine);
  const container = document.createElement('div');

  document.body.append(container);
  new AnnouncementsControl({ world, events }).mount(container);

  const root = container.querySelector<HTMLElement>(`.${styles.root}`)!;

  const click = (selector: string) =>
    root.querySelector<HTMLElement>(selector)!.click();

  return {
    myProvince,
    theirProvince,
    ruler,
    vassal,
    desert: (province: Province, name: string) =>
      events.publish(
        new UnitDesertedEvent(province, HiredUnit.ofName(name)!, 'faithless'),
      ),
    find: (province: Province) =>
      events.publish(
        new ArtifactFoundEvent(province, theirProvince, SWORD_OF_FIRE),
      ),
    continue: () => click('[data-continue]'),
    take: () => click('[data-take]'),
    choose: (name: string) => click(`[data-value="${name}"]`),
    asks: () =>
      !root.querySelector('[data-ask]')!.classList.contains(styles.hidden!),
    offersContinue: () =>
      !root
        .querySelector('[data-continue]')!
        .classList.contains(styles.hidden!),
    shown: () => !root.classList.contains(styles.hidden!),
    text: () => root.querySelector('[data-text]')!.textContent,
    pending: () => root.querySelector('[data-pending]')!.textContent,
  };
}

describe('AnnouncementsControl', () => {
  afterEach(() => document.body.replaceChildren());

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

  it('withholds a found artifact until a family member is named', () => {
    const screen = setup();

    screen.find(screen.myProvince);

    expect(screen.text()).toContain('Sword of Fire');
    expect(screen.asks()).toBe(true);
    expect(screen.offersContinue()).toBe(false);

    screen.choose('Pender');
    screen.take();

    expect(screen.vassal.stats.war).toBe(80);
    expect(screen.ruler.stats.war).toBe(50);
    expect(screen.shown()).toBe(false);
  });
});
