// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ComputerPlayer } from '@/core/ai/ComputerPlayer';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { IncidentReportedEvent } from '@/core/events/IncidentReportedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { WorldEngine } from '@/core/WorldEngine';
import styles from '@/ui/Announcements/Announcements.module.scss';
import { AnnouncementsControl } from '@/ui/Announcements/AnnouncementsControl';

import { makeFamily, makeGeneral, makeProvince, makeWorld } from './factories';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('Province turn event reports', () => {
  it('resolves September damage before income but shows reports after the province turn starts', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const family = makeFamily();
    const province = makeProvince({
      number: 7,
      name: 'Rodale',
      family,
      governor: family.ruler,
      loyalty: 80,
      cultivation: 100,
      food: 100,
      gold: 100,
      troops: 100,
    });
    const { world, events } = makeWorld(
      [province],
      family,
      new CalendarDate(1186, 9),
    );
    const container = document.createElement('div');
    document.body.append(container);
    const announcements = new AnnouncementsControl({ world, events });
    announcements.mount(container);
    const root = container.querySelector<HTMLElement>(`.${styles.root}`)!;
    const proceed = root.querySelector<HTMLButtonElement>('[data-continue]')!;
    const order: string[] = [];
    events.subscribe(TurnStartedEvent, () => order.push('turn'));
    events.subscribe(IncidentReportedEvent, (event) => {
      expect(event.incident.province).toBe(world.turnQueue.current);
      order.push(event.incident.definition.image);
    });
    new WorldEngine(world, events).start();

    expect(order).toEqual(['turn', 'fire', 'plague']);
    expect(province.resources.food).toBe(260);
    expect(root.querySelector('[data-title]')?.textContent).toBe(
      'Rodale — Fire',
    );
    expect(root.querySelector('[data-detail]')?.textContent).toBe('');
    expect(root.querySelector('[data-pending]')?.textContent).toBe('');
    proceed.click();
    await Promise.resolve();
    expect(root.querySelector('[data-title]')?.textContent).toBe(
      'Rodale — Plague',
    );
    expect(order).toHaveLength(3);
    proceed.click();
    await Promise.resolve();
    expect(root.classList.contains(styles.hidden!)).toBe(true);
    expect(province.actionCount).toBe(0);
    events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
    expect(order).toEqual(['turn', 'fire', 'plague', 'turn']);
    announcements.unmount();
  });

  it.each(['rival', 'entrusted'] as const)(
    'waits for %s province reports before AI orders and defers other provinces reports to their own turns',
    async (mode) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const play = vi.spyOn(ComputerPlayer.prototype, 'play');
      const family = makeFamily();
      const governor = makeGeneral();
      family.members = [...family.members, governor];
      const home = makeProvince({
        number: 1,
        name: 'Ulster',
        family,
        governor: family.ruler,
        cultivation: 100,
      });
      family.homeProvince = home;
      const otherFamily = mode === 'rival' ? makeFamily() : family;
      const other = makeProvince({
        number: 7,
        name: 'Rodale',
        family: otherFamily,
        governor,
        cultivation: 100,
        gold: 100,
        food: 100,
        loyalty: 80,
      });
      if (mode === 'entrusted') {
        other.entrust();
      }
      const { world, events } = makeWorld(
        [home, other],
        family,
        new CalendarDate(1186, 9),
      );
      const container = document.createElement('div');
      document.body.append(container);
      const announcements = new AnnouncementsControl({ world, events });
      announcements.mount(container);
      const root = container.querySelector<HTMLElement>(`.${styles.root}`)!;
      const incidents: number[] = [];
      const turns: number[] = [];
      events.subscribe(IncidentReportedEvent, (event) =>
        incidents.push(event.incident.province.number),
      );
      events.subscribe(TurnStartedEvent, (event) =>
        turns.push(event.province.number),
      );
      new WorldEngine(world, events).start();

      expect(incidents).toEqual([7, 7]);
      expect(turns).toEqual([7]);
      expect(play).not.toHaveBeenCalled();
      const proceed = root.querySelector<HTMLButtonElement>('[data-continue]')!;
      proceed.click();
      await Promise.resolve();
      expect(play).not.toHaveBeenCalled();
      proceed.click();
      await Promise.resolve();
      expect(play).toHaveBeenCalledExactlyOnceWith(other);
      expect(turns).toEqual([7, 1]);
      expect(incidents).toEqual([7, 7, 1]);
      expect(root.querySelector('[data-title]')?.textContent).toBe(
        'Ulster — Plague',
      );
      announcements.unmount();
    },
  );
});
