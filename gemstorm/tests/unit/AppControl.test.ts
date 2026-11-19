// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SCENARIOS } from '@/config/scenarios';
import { AppControl } from '@/ui/app/App/AppControl';
import { CampaignControl } from '@/ui/app/Campaign/CampaignControl';
import { SoundBoard } from '@/ui/common/sound/SoundBoard';

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

function familySelect(): HTMLElement {
  return document.querySelector<HTMLElement>(
    '[aria-labelledby="family-heading"]',
  )!;
}

function advisorSelect(): HTMLElement {
  return document.querySelector<HTMLElement>(
    '[aria-labelledby="advisor-heading"]',
  )!;
}

function stage(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-stage]')!;
}

function beginCampaign(family: string): void {
  button('New Game').click();
  document
    .querySelector<HTMLButtonElement>(
      '[data-tile-grid="scenarios"] [data-key="2"]',
    )!
    .click();
  button('Next', scenarioSelect()).click();
  familySelect()
    .querySelector<HTMLButtonElement>(`[data-key="${family}"]`)!
    .click();
  button('Next', familySelect()).click();
  advisorSelect()
    .querySelector<HTMLButtonElement>('[data-key="Vesha"]')!
    .click();
  button('Begin', advisorSelect()).click();
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    },
  });
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
  vi.restoreAllMocks();
  vi.useRealTimers();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
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

  it('moves from the scenario to the house choice on Next, and back', () => {
    mount();
    button('New Game').click();

    button('Next', scenarioSelect()).click();

    expect(scenarioSelect().checkVisibility()).toBe(false);
    expect(familySelect().checkVisibility()).toBe(true);

    button('Back', familySelect()).click();

    expect(familySelect().checkVisibility()).toBe(false);
    expect(scenarioSelect().checkVisibility()).toBe(true);
  });

  it('moves from the house to the advisor choice on Next, and back', () => {
    mount();
    button('New Game').click();
    button('Next', scenarioSelect()).click();

    button('Next', familySelect()).click();

    expect(familySelect().checkVisibility()).toBe(false);
    expect(advisorSelect().checkVisibility()).toBe(true);
    expect(stage().childElementCount).toBe(0);

    button('Back', advisorSelect()).click();

    expect(advisorSelect().checkVisibility()).toBe(false);
    expect(familySelect().checkVisibility()).toBe(true);
  });

  it('begins a campaign with the chosen scenario, house, and advisor', () => {
    const scenario = SCENARIOS[1]!;
    const family = scenario.playableFamilies[2]!;
    const create = vi.spyOn(CampaignControl, 'create');
    mount();
    beginCampaign(family);

    expect(create).toHaveBeenCalledWith(
      {
        scenario,
        family,
        advisor: expect.objectContaining({ name: 'Vesha' }),
      },
      expect.anything(),
    );
    expect(advisorSelect().checkVisibility()).toBe(false);
    expect(stage().textContent).toContain(`Month 1, ${scenario.year}`);
  });

  it('quits a campaign from the game menu back to the title', () => {
    const scenario = SCENARIOS[1]!;
    const playMusic = vi.spyOn(SoundBoard.prototype, 'playMusic');
    mount();
    beginCampaign(scenario.playableFamilies[2]!);

    stage()
      .querySelector<HTMLButtonElement>('button[data-action="menu"]')!
      .click();
    button('Quit to Title', stage()).click();
    button('Quit', stage()).click();

    expect(stage().childElementCount).toBe(0);
    expect(title().checkVisibility()).toBe(true);
    expect(playMusic).toHaveBeenLastCalledWith('title');

    beginCampaign(scenario.playableFamilies[2]!);

    expect(stage().textContent).toContain(`Month 1, ${scenario.year}`);
  });
});
