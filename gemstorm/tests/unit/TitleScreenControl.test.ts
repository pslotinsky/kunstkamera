// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorldFactory } from '@/core/WorldFactory';
import { SoundBoard } from '@/ui/common/sound/SoundBoard';
import { TitleScreenControl } from '@/ui/screens/TitleScreen/TitleScreenControl';

import { advanceTo, makeSaves } from './factories';

let title: TitleScreenControl | undefined;

function mount(saves = makeSaves().saves): void {
  const container = document.createElement('div');
  document.body.append(container);
  title = new TitleScreenControl({ sounds: new SoundBoard(), saves });
  title.mount(container);
}

function button(label: string): HTMLButtonElement {
  const buttons = [...document.querySelectorAll('button')];

  return buttons.find((candidate) => candidate.textContent?.trim() === label)!;
}

function isScenePaused(): boolean {
  const scene = document.querySelector('[data-depth]')!.parentElement!;

  return [...scene.classList].some((name) => name.includes('paused'));
}

beforeEach(() => {
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => Object.assign(new EventTarget(), { matches: false })),
  );
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
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
  title?.unmount();
  title = undefined;
  document.body.replaceChildren();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('TitleScreenControl', () => {
  it('pauses the scene while Options is open', () => {
    mount();

    button('Options').click();

    const options = document.querySelector<HTMLDialogElement>(
      '[aria-labelledby="options-heading"]',
    )!;
    expect(options.open).toBe(true);
    expect(isScenePaused()).toBe(true);

    options.close();

    expect(isScenePaused()).toBe(false);
  });

  it('pauses the scene while hidden and resumes it when shown again', () => {
    mount();

    title!.hide();
    expect(isScenePaused()).toBe(true);

    title!.show();
    expect(isScenePaused()).toBe(false);
  });

  it('shows Continue when another tab saves a game', () => {
    const { saves } = makeSaves();
    mount(saves);
    const continueButton =
      document.querySelector<HTMLButtonElement>('[data-continue]')!;
    expect(continueButton.hidden).toBe(true);

    const world = new WorldFactory().create();
    advanceTo(world, world.player.homeProvince);
    expect(saves.save(1, world)).toBe(true);
    window.dispatchEvent(new StorageEvent('storage'));

    expect(continueButton.hidden).toBe(false);
    expect(continueButton.ariaLabel).toContain('Month 1');
  });
});
