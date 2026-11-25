// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TurnHeldEvent } from '@/core/events/TurnHeldEvent';
import { TurnReleasedEvent } from '@/core/events/TurnReleasedEvent';
import { WorldFactory } from '@/core/WorldFactory';
import { EventBus } from '@/lib/EventBus';
import { SoundBoard } from '@/ui/common/sound/SoundBoard';
import { GameMenuControl } from '@/ui/screens/StrategyScreen/GameMenu/GameMenuControl';
import type { GameMenuContext } from '@/ui/screens/StrategyScreen/GameMenu/types';

import { makeSaves } from './factories';

let menu: GameMenuControl | undefined;

function setup(overrides: Partial<GameMenuContext> = {}) {
  const events = new EventBus();
  const held = vi.fn();
  const released = vi.fn();
  const quit = vi.fn();
  const container = document.body.appendChild(document.createElement('div'));

  events.subscribe(TurnHeldEvent, held);
  events.subscribe(TurnReleasedEvent, released);
  menu = new GameMenuControl({
    events,
    sounds: new SoundBoard(),
    world: new WorldFactory().create(),
    saves: overrides.saves ?? makeSaves().saves,
    saveBlockReason: () => undefined,
    ...overrides,
  });
  menu.mount(container);
  menu.onQuit(quit);
  menu.open();

  return { menu, held, released, quit };
}

function button(label: string): HTMLButtonElement {
  return [...document.querySelectorAll('button')].find(
    (candidate) => candidate.textContent?.trim() === label,
  )!;
}

function dialog(heading: string): HTMLDialogElement {
  return document.querySelector<HTMLDialogElement>(
    `dialog[aria-labelledby="${heading}"]`,
  )!;
}

function isShown(section: 'choices' | 'confirm'): boolean {
  const element = document.querySelector<HTMLElement>(`[data-${section}]`)!;

  return ![...element.classList].some((name) => name.includes('hidden'));
}

beforeEach(() => {
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
});

afterEach(() => {
  vi.unstubAllGlobals();
  menu?.unmount();
  menu = undefined;
  document.body.replaceChildren();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('GameMenuControl', () => {
  it('holds the turn while open and resumes play on Resume', () => {
    const { held, released } = setup();

    expect(dialog('game-menu-heading').open).toBe(true);
    expect(held).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(button('Resume'));

    button('Resume').click();

    expect(dialog('game-menu-heading').open).toBe(false);
    expect(released).toHaveBeenCalledOnce();
  });

  it('holds the turn only once when opened twice', () => {
    const { menu, held } = setup();

    menu.open();

    expect(held).toHaveBeenCalledOnce();
  });

  it('opens Options over the menu', () => {
    setup();

    button('Options').click();

    expect(dialog('options-heading').open).toBe(true);
    expect(dialog('game-menu-heading').open).toBe(true);
  });

  it('asks before quitting, and Stay returns to the choices', () => {
    const { quit } = setup();

    button('Quit to Title').click();

    expect(isShown('confirm')).toBe(true);
    expect(isShown('choices')).toBe(false);
    expect(document.activeElement).toBe(button('Stay'));

    button('Stay').click();

    expect(isShown('choices')).toBe(true);
    expect(isShown('confirm')).toBe(false);
    expect(quit).not.toHaveBeenCalled();
  });

  it('quits once the player confirms', () => {
    const { quit } = setup();

    button('Quit to Title').click();
    button('Quit').click();

    expect(quit).toHaveBeenCalledOnce();
  });

  it('checks eligibility again on replacement and keeps the menu open after a rejected write', () => {
    const { saves, storage, values } = makeSaves();
    const setItem = vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    values.set('gemstorm.save.1', '{broken save');
    const world = new WorldFactory().create();
    while (
      world.turnQueue.current &&
      !world.isPlayerRun(world.turnQueue.current)
    ) {
      world.turnQueue.next();
    }
    const saveBlockReason = vi.fn<() => string | undefined>();
    const { released } = setup({ world, saves, saveBlockReason });

    button('Save Game').click();
    button('Slot 1 Unreadable save').click();
    const replace = button('Replace');
    replace.focus();
    saveBlockReason.mockReturnValue('Finish the current decision.');
    replace.click();
    expect(setItem).not.toHaveBeenCalled();
    const message =
      dialog('game-menu-heading').querySelector('[role="status"]');
    expect(message?.textContent).toBe('Finish the current decision.');

    saveBlockReason.mockReturnValue(undefined);
    replace.click();
    expect(setItem).toHaveBeenCalledOnce();
    expect(message?.textContent).toBe('The game could not be saved.');
    expect(document.activeElement).toBe(replace);
    expect(dialog('game-menu-heading').open).toBe(true);
    expect(values.get('gemstorm.save.1')).toBe('{broken save');
    expect(released).not.toHaveBeenCalled();
  });
});
