// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CalendarDate } from '@/core/domain/CalendarDate';
import { ProvinceEvents } from '@/core/domain/ProvinceEvents';
import { IncidentReportedEvent } from '@/core/events/IncidentReportedEvent';
import { GameScreenControl } from '@/ui/GameScreen/GameScreenControl';
import { SoundBoard } from '@/ui/sound/SoundBoard';

import { advanceTo, makeFamily, makeProvince, makeWorld } from './factories';

const screens: GameScreenControl[] = [];
const visibility = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'checkVisibility',
);

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'checkVisibility', {
    configurable: true,
    value(this: HTMLElement): boolean {
      return (
        !this.hidden &&
        ![...this.classList].some((name) => name.includes('hidden'))
      );
    },
  });
});

afterEach(() => {
  for (const screen of screens.splice(0)) {
    screen.unmount();
  }
  document.body.replaceChildren();
  if (visibility) {
    Object.defineProperty(HTMLElement.prototype, 'checkVisibility', visibility);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  }
});

function setup() {
  const player = makeFamily({ name: 'Blanche' });
  const rival = makeFamily({ name: 'Lyle' });
  const home = makeProvince({
    number: 2,
    name: 'Ulster',
    family: player,
    governor: player.ruler,
    cultivation: 100,
  });
  const enemy = makeProvince({
    number: 1,
    name: 'Rodale',
    family: rival,
    governor: rival.ruler,
    cultivation: 100,
  });
  const { world, events } = makeWorld(
    [enemy, home],
    player,
    new CalendarDate(1186, 4),
  );
  advanceTo(world, enemy);
  const container = document.createElement('div');
  document.body.append(container);
  const screen = new GameScreenControl({
    world,
    events,
    sounds: new SoundBoard(),
    commands: [],
  });
  screen.mount(container);
  screens.push(screen);

  const announce = (province: typeof home, disaster = false) => {
    if (!disaster) {
      province.recordAction(1);
      province.recordAction(1);
      province.recordAction(1);
    }
    const date = disaster ? new CalendarDate(world.date.year, 6) : world.date;
    const incidents = new ProvinceEvents([province], date, () => 0).resolve();
    for (const incident of incidents) {
      events.publish(new IncidentReportedEvent(incident));
    }
  };
  const proceed = () =>
    container.querySelector<HTMLButtonElement>('[data-continue]')!.click();
  const title = () =>
    container
      .querySelector('[data-continue]')!
      .closest('[data-overlay]')!
      .querySelector('[data-title]')?.textContent;
  const provinceName = () =>
    container.querySelectorAll('aside header h2')[1]?.textContent;
  return {
    container,
    home,
    enemy,
    world,
    announce,
    proceed,
    provinceName,
    title,
  };
}

describe('Event province focus', () => {
  it('focuses the displayed incident instead of leaving the previous enemy turn in the panel', () => {
    const fixture = setup();
    expect(fixture.provinceName()).toBe('1: Rodale');
    fixture.announce(fixture.home);

    expect(fixture.provinceName()).toBe('2: Ulster');
    expect(
      fixture.container
        .querySelector('.province[data-province="2"]')
        ?.classList.contains('selected'),
    ).toBe(true);
    expect(fixture.title()).toContain('Ulster');
    expect(fixture.world.turnQueue.current).toBe(fixture.enemy);
    fixture.proceed();
    expect(fixture.provinceName()).toBe('1: Rodale');
    expect(
      fixture.container
        .querySelector('.province[data-province="1"]')
        ?.classList.contains('current'),
    ).toBe(true);
  });

  it('follows each report across houses and restores the active province after the last one', () => {
    const fixture = setup();
    fixture.announce(fixture.enemy, true);
    fixture.announce(fixture.home);
    expect(fixture.title()).toContain('Rodale');
    fixture.proceed();
    expect(fixture.provinceName()).toBe('2: Ulster');
    fixture.proceed();
    expect(fixture.provinceName()).toBe('1: Rodale');
  });
});
