// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { Artifact } from '@/core/domain/Artifact';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';
import { Resources } from '@/core/domain/Resources';
import { Succession } from '@/core/domain/Succession';
import { AllianceOfferedEvent } from '@/core/events/AllianceOfferedEvent';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';
import { SuccessionReportedEvent } from '@/core/events/SuccessionReportedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
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
    events,
    theirs,
    world,
    mine,
    myProvince,
    theirProvince,
    ruler,
    vassal,
    mourn: () => {
      world.bury(ruler);

      const outcome = new Succession(world).replace(mine);

      events.publish(new SuccessionReportedEvent(outcome, 'death'));
    },
    offers: (name: string) => !!root.querySelector(`[data-value="${name}"]`),
    desert: (province: Province, name: string) =>
      events.publish(
        new UnitDesertedEvent(province, HiredUnit.ofName(name)!, 'faithless'),
      ),
    find: (province: Province) =>
      events.publish(
        new ArtifactFoundEvent(province, theirProvince, SWORD_OF_FIRE),
      ),
    continue: () => click('[data-continue]'),
    confirm: () => click('[data-choose]'),
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
    screen.confirm();

    expect(screen.vassal.stats.war).toBe(80);
    expect(screen.ruler.stats.war).toBe(50);
    expect(screen.shown()).toBe(false);
  });

  it('lets you choose your own heir among your kin, the strongest preselected', () => {
    const screen = setup();
    const karl = makeGeneral({ name: 'Karl', lineage: 'Blanche', war: 60 });
    const anselm = makeGeneral({ name: 'Anselm', lineage: 'Blanche' });

    screen.mine.enlist(karl);
    screen.mine.enlist(anselm);
    screen.mourn();

    expect(screen.asks()).toBe(true);
    expect(screen.offers('Pender')).toBe(false);
    expect(screen.mine.ruler).toBe(karl);

    screen.choose('Anselm');
    screen.confirm();

    expect(screen.mine.ruler).toBe(anselm);
    expect(screen.myProvince.governor).toBe(anselm);
  });

  it('tells you what a rival did to your land, in its words', () => {
    const screen = setup();

    screen.events.publish(
      new MissionReportedEvent(screen.theirProvince, {
        kind: 'plunder',
        target: screen.myProvince,
        loot: Resources.from({ gold: 40, food: 0 }),
      }),
    );

    expect(screen.text()).toBe(
      'Agents from Fitzroy plundered Lorraine: 40 gold, 0 food.',
    );
  });

  it('keeps quiet about what rivals do to each other', () => {
    const screen = setup();
    const other = makeProvince({
      number: 3,
      family: makeFamily({ name: 'Lyle' }),
    });

    screen.events.publish(
      new MissionReportedEvent(screen.theirProvince, {
        kind: 'plunder',
        target: other,
        loot: undefined,
      }),
    );

    expect(screen.shown()).toBe(false);
  });

  it('forms an alliance a rival offers once you accept, then lets the month go on', () => {
    const screen = setup();
    const ended: TurnEndedEvent[] = [];

    screen.events.subscribe(TurnEndedEvent, (event) => ended.push(event));
    screen.events.publish(
      new AllianceOfferedEvent(screen.theirProvince, screen.theirs),
    );
    screen.confirm();

    expect(screen.mine.ally).toBe(screen.theirs);
    expect(ended).toHaveLength(1);
  });
});
