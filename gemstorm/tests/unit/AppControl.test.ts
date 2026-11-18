// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CampaignStartedEvent } from '@/core/events/CampaignStartedEvent';
import { AppControl } from '@/ui/App/AppControl';
import { SoundBoard } from '@/ui/sound/SoundBoard';

import { makeFamily, makeProvince, makeWorld } from './factories';

let shell: AppControl | undefined;
const visibility = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'checkVisibility',
);

function mount() {
  const player = makeFamily({ name: 'Alderwyn' });
  const home = makeProvince({ number: 1, name: 'Ulster', family: player });
  const { world, events } = makeWorld([home], player);
  const container = document.createElement('div');
  document.body.append(container);
  shell = new AppControl({
    world,
    events,
    commands: [],
    sounds: new SoundBoard(),
  });
  shell.mount(container);

  return { events };
}

function newGameButton(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>('[data-new-game]')!;
}

function title(): HTMLElement {
  return document.querySelector<HTMLElement>(
    '[aria-label="Gemstorm title screen"]',
  )!;
}

function campaign(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-campaign]')!;
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'checkVisibility', {
    configurable: true,
    value(this: HTMLElement): boolean {
      return ![...this.classList].some((name) => name.includes('hidden'));
    },
  });
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => Object.assign(new EventTarget(), { matches: false })),
  );
});

afterEach(() => {
  shell?.unmount();
  shell = undefined;
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  if (visibility) {
    Object.defineProperty(HTMLElement.prototype, 'checkVisibility', visibility);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  }
});

describe('AppControl', () => {
  it('keeps the campaign inert behind the title until a new game begins', () => {
    mount();

    expect(campaign().hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(newGameButton());
  });

  it('hides the title and starts the campaign on New Game', () => {
    const { events } = mount();
    const started = vi.fn();
    events.subscribe(CampaignStartedEvent, started);

    newGameButton().click();

    expect(started).toHaveBeenCalledOnce();
    expect(title().checkVisibility()).toBe(false);
    expect(campaign().hasAttribute('inert')).toBe(false);
  });
});
