// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SoundBoard } from '@/ui/sound/SoundBoard';
import { TitleScreenControl } from '@/ui/TitleScreen/TitleScreenControl';

let title: TitleScreenControl | undefined;

function mount(): void {
  const container = document.createElement('div');
  document.body.append(container);
  title = new TitleScreenControl({ sounds: new SoundBoard() });
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

    expect(document.querySelector('dialog')?.open).toBe(true);
    expect(isScenePaused()).toBe(true);

    document.querySelector('dialog')!.close();

    expect(isScenePaused()).toBe(false);
  });

  it('pauses the scene when the title closes', () => {
    mount();

    title!.close();

    expect(isScenePaused()).toBe(true);
  });
});
