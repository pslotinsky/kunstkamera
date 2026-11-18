// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SCENARIOS } from '@/config/scenarios';
import { AppControl } from '@/ui/App/AppControl';
import { SoundBoard } from '@/ui/sound/SoundBoard';

let shell: AppControl | undefined;
const visibility = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'checkVisibility',
);

function mount(): void {
  const container = document.createElement('div');
  document.body.append(container);
  shell = new AppControl({ sounds: new SoundBoard() });
  shell.mount(container);
}

function button(
  label: string,
  within: ParentNode = document,
): HTMLButtonElement {
  const buttons = [...within.querySelectorAll('button')];

  return buttons.find((candidate) => candidate.textContent?.trim() === label)!;
}

function title(): HTMLElement {
  return document.querySelector<HTMLElement>(
    '[aria-label="Gemstorm title screen"]',
  )!;
}

function scenarioSelect(): HTMLElement {
  return document.querySelector<HTMLElement>(
    '[aria-labelledby="scenario-heading"]',
  )!;
}

function stage(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-stage]')!;
}

beforeEach(() => {
  vi.useFakeTimers();
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
  vi.useRealTimers();
  if (visibility) {
    Object.defineProperty(HTMLElement.prototype, 'checkVisibility', visibility);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
  }
});

describe('AppControl', () => {
  it('opens on the title, with no campaign yet', () => {
    mount();

    expect(title().checkVisibility()).toBe(true);
    expect(scenarioSelect().checkVisibility()).toBe(false);
    expect(document.activeElement).toBe(button('New Game'));
    expect(stage().childElementCount).toBe(0);
  });

  it('moves from the title to the scenario choice on New Game', () => {
    mount();

    button('New Game').click();

    expect(title().checkVisibility()).toBe(false);
    expect(scenarioSelect().checkVisibility()).toBe(true);
  });

  it('returns to the title on Back', () => {
    mount();
    button('New Game').click();

    button('Back', scenarioSelect()).click();

    expect(scenarioSelect().checkVisibility()).toBe(false);
    expect(title().checkVisibility()).toBe(true);
  });

  it('starts a campaign in the chosen scenario on Next', () => {
    const chosen = SCENARIOS[1]!;
    mount();
    button('New Game').click();

    document.querySelector<HTMLButtonElement>('[data-scenario="2"]')!.click();
    button('Next', scenarioSelect()).click();

    expect(scenarioSelect().checkVisibility()).toBe(false);
    expect(stage().childElementCount).toBeGreaterThan(0);
    expect(stage().textContent).toContain(`Month 1, ${chosen.year}`);
  });
});
