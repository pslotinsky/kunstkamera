// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OptionsControl } from '@/ui/common/Options/OptionsControl';
import { SoundBoard } from '@/ui/common/sound/SoundBoard';

let options: OptionsControl | undefined;

function mount(sounds = new SoundBoard()) {
  const container = document.createElement('div');
  document.body.append(container);
  options = new OptionsControl({ sounds });
  options.mount(container);
  options.show();

  return { sounds };
}

function masterToggle(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>(
    'dialog > label input[type="checkbox"]',
  )!;
}

function toggle(channel: string): HTMLInputElement {
  return document.querySelector<HTMLInputElement>(
    `[data-channel="${channel}"] [data-toggle]`,
  )!;
}

function slider(channel: string): HTMLInputElement {
  return document.querySelector<HTMLInputElement>(
    `[data-channel="${channel}"] [data-slider]`,
  )!;
}

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
    },
  });
});

afterEach(() => {
  options?.unmount();
  options = undefined;
  document.body.replaceChildren();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  vi.restoreAllMocks();
});

describe('OptionsControl', () => {
  it('starts from the current channel settings', () => {
    const sounds = new SoundBoard();
    sounds.music.setVolume(0.4);
    sounds.music.setEnabled(false);

    mount(sounds);

    expect(masterToggle().checked).toBe(true);
    expect(toggle('music').checked).toBe(false);
    expect(slider('music').value).toBe('40');
    expect(slider('music').disabled).toBe(true);
    expect(
      document
        .querySelector('[data-channel="music"] [data-value]')
        ?.textContent?.trim(),
    ).toBe('40%');
    expect(toggle('sfx').checked).toBe(true);
  });

  it('sets the channel volume from its slider', () => {
    const { sounds } = mount();
    const volume = slider('music');

    volume.value = '35';
    volume.dispatchEvent(new Event('input', { bubbles: true }));

    expect(sounds.music.volume).toBe(0.35);
    expect(
      document.querySelector('[data-channel="music"] [data-value]')
        ?.textContent,
    ).toBe('35%');
  });

  it('locks the channels while all sounds are off and restores their choices', () => {
    const { sounds } = mount();

    toggle('music').click();
    masterToggle().click();

    expect(sounds.master.isEnabled).toBe(false);
    expect(toggle('music').disabled).toBe(true);
    expect(toggle('sfx').disabled).toBe(true);
    expect(slider('sfx').disabled).toBe(true);

    masterToggle().click();

    expect(toggle('music').checked).toBe(false);
    expect(slider('music').disabled).toBe(true);
    expect(toggle('sfx').disabled).toBe(false);
    expect(slider('sfx').disabled).toBe(false);
  });

  it('previews an effect when the SFX slider is released', () => {
    const { sounds } = mount();
    const click = vi.spyOn(sounds, 'playClick').mockImplementation(() => {});

    slider('sfx').dispatchEvent(new Event('change', { bubbles: true }));

    expect(click).toHaveBeenCalledOnce();
  });
});
