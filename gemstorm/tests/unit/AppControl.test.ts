// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SCENARIOS } from '@/config/scenarios';
import { GameSaves } from '@/core/saves/GameSaves';
import { WorldFactory } from '@/core/WorldFactory';
import { AppControl } from '@/ui/app/App/AppControl';
import { CampaignControl } from '@/ui/app/Campaign/CampaignControl';
import { SoundBoard } from '@/ui/common/sound/SoundBoard';

import { blockSaves } from './factories';

let shell: AppControl | undefined;
const browserStorage = globalThis.localStorage;
const visibility = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'checkVisibility',
);

function browserSaves(): GameSaves {
  return new GameSaves();
}

function mount(saves = browserSaves()): void {
  const container = document.createElement('div');
  document.body.append(container);
  shell = new AppControl({ sounds: new SoundBoard(), saves });
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

function picker(): HTMLDialogElement {
  return document.querySelector<HTMLDialogElement>('[data-load-picker]')!;
}

function stage(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-stage]')!;
}

function control(selector: string): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(selector)!;
}

function quitToTitle(): void {
  control('[data-action="menu"]').click();
  button('Quit to Title', stage()).click();
  button('Quit', stage()).click();
}

function seedSave() {
  const saves = browserSaves();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  const world = new WorldFactory().create();

  while (
    world.turnQueue.current &&
    !world.isPlayerRun(world.turnQueue.current)
  ) {
    world.turnQueue.next();
  }
  expect(saves.save(1, world)).toBe(true);

  return { saves, world };
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
  window.localStorage.clear();
  vi.useFakeTimers();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
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
      expect.any(GameSaves),
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

  it('trades, saves, and continues from the exact same province turn after remounting', () => {
    const { saves, world } = seedSave();
    const { current, turnNumber } = world.turnQueue;
    const startingGold = current!.resources.gold;
    mount(saves);
    const continueButton = control('[data-continue]');

    expect(document.activeElement).toBe(continueButton);
    expect(continueButton.ariaLabel).toBe(
      `Continue: House ${world.player.name}, ${world.date}`,
    );
    expect(continueButton.textContent).toContain(String(world.date));
    expect(
      [...title().querySelectorAll('nav button')].map((entry) =>
        entry.textContent?.trim().split(/\s+/).slice(0, 2).join(' '),
      ),
    ).toEqual([
      `Continue ${world.player.name}`,
      'New Game',
      'Load Game',
      'Options',
    ]);
    continueButton.click();
    expect(stage().textContent).toContain(
      `Turn ${turnNumber}: ${current!.name}`,
    );

    control('button[data-group="Domestic"]').click();
    control('[data-command="Trade"]').click();
    const menu = control('[data-action="menu"]');
    menu.click();
    expect(
      stage().querySelector<HTMLButtonElement>('[data-save]')!.disabled,
    ).toBe(true);
    expect(stage().querySelector('#save-block-reason')?.textContent).toContain(
      'current order',
    );
    button('Resume', stage()).click();

    button('Buy', stage()).click();
    const trade = stage().querySelector<HTMLElement>('[data-dialog="trade"]')!;
    const amount = trade.querySelector<HTMLInputElement>(
      '[data-amount-input]',
    )!;
    amount.value = '10';
    amount.dispatchEvent(new Event('input'));
    button('Yea', trade).click();
    button('Nay', trade).click();

    vi.advanceTimersByTime(1000);
    menu.click();
    expect(
      stage().querySelector<HTMLButtonElement>('[data-save]')!.disabled,
    ).toBe(false);
    stage().querySelector<HTMLButtonElement>('[data-save]')!.click();
    stage().querySelector<HTMLButtonElement>('[data-slot="2"]')!.click();
    const menuDialog = stage().querySelector<HTMLDialogElement>(
      '[aria-labelledby="game-menu-heading"]',
    )!;
    const toast = stage().querySelector('[data-save-toast]')!;
    expect(menuDialog.open).toBe(false);
    expect(toast.textContent).toBe('Game saved to Slot 2');
    vi.advanceTimersByTime(2600);
    expect(toast.textContent).toBe('');
    expect(saves.load(2)?.turnQueue.current?.resources.gold).toBe(
      startingGold - 10,
    );
    expect(saves.load(1)?.turnQueue.current?.resources.gold).toBe(startingGold);

    shell?.unmount();
    mount();
    control('[data-continue]').click();
    expect(stage().textContent).toContain(
      `Turn ${turnNumber}: ${current!.name}`,
    );
    expect(control('[data-command="Trade"]').disabled).toBe(false);
    expect(stage().textContent).toContain(String(startingGold - 10));
  });

  it('returns focus after replacement and load cancellation, and loads the chosen older slot', () => {
    const { saves, world } = seedSave();
    const { current } = world.turnQueue;
    world.date = world.date.next();
    vi.advanceTimersByTime(1000);
    expect(saves.save(2, world)).toBe(true);
    mount(saves);
    control('[data-continue]').click();

    control('[data-action="menu"]').click();
    stage().querySelector<HTMLButtonElement>('[data-save]')!.click();
    stage().querySelector<HTMLButtonElement>('[data-slot="1"]')!.click();
    expect(document.activeElement).toBe(
      stage().querySelector<HTMLButtonElement>('[data-cancel]')!,
    );
    const menu = stage().querySelector<HTMLDialogElement>(
      '[aria-labelledby="game-menu-heading"]',
    )!;
    menu.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(document.activeElement).toBe(
      stage().querySelector<HTMLButtonElement>('[data-slot="1"]')!,
    );
    expect(saves.load(1)?.date.month).toBe(1);
    button('Back', menu).click();
    button('Resume', menu).click();
    quitToTitle();

    const loadGame = control('[data-load-game]');
    loadGame.click();
    expect(document.activeElement).toBe(
      picker().querySelector<HTMLButtonElement>('[data-slot="2"]')!,
    );
    expect(picker().textContent).toContain(current!.name);
    button('Back', picker()).click();
    expect(document.activeElement).toBe(loadGame);
    loadGame.click();
    picker().querySelector<HTMLButtonElement>('[data-slot="1"]')!.click();
    expect(stage().childElementCount).toBe(0);
    button('Load', picker()).click();

    expect(stage().textContent).toContain('Month 1,');
    quitToTitle();
    expect(control('[data-continue]').textContent).toContain(
      String(world.date),
    );
    expect(saves.list().map(({ status }) => status)).toEqual([
      'ready',
      'ready',
      'empty',
    ]);
  });

  it('keeps New Game available when storage is blocked or no slot is readable', () => {
    mount(blockSaves());

    expect(control('[data-continue]').hidden).toBe(true);
    expect(control('[data-load-game]').hidden).toBe(true);
    expect(document.activeElement).toBe(button('New Game', title()));
    expect(title().querySelector('[role="status"]')?.textContent).toContain(
      'unavailable',
    );

    shell?.unmount();
    vi.stubGlobal('localStorage', browserStorage);
    window.localStorage.setItem('gemstorm.save.1', '{broken json');
    window.localStorage.setItem('gemstorm.save.2', '{"version":42}');
    mount();
    expect(control('[data-continue]').hidden).toBe(true);
    expect(control('[data-load-game]').hidden).toBe(false);
    control('[data-load-game]').click();
    expect(
      picker().querySelector<HTMLButtonElement>('[data-slot="1"]')!.textContent,
    ).toContain('Unreadable save');
    expect(
      picker().querySelector<HTMLButtonElement>('[data-slot="2"]')!.textContent,
    ).toContain('Unsupported version');
    expect(control('[data-confirm-load]').disabled).toBe(true);
  });
});
