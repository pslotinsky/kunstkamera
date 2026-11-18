// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SoundBoard } from '@/ui/sound/SoundBoard';
import { SoundDirector } from '@/ui/sound/SoundDirector';

let director: SoundDirector | undefined;

function setup() {
  const sounds = new SoundBoard();
  const music = vi.spyOn(sounds, 'playMusic').mockImplementation(() => {});
  const click = vi.spyOn(sounds, 'playClick').mockImplementation(() => {});

  director = new SoundDirector({ sounds });
  director.listen();

  return { music, click };
}

afterEach(() => {
  director?.stop();
  director = undefined;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('SoundDirector', () => {
  it('plays the title music from launch', () => {
    const { music } = setup();

    expect(music).toHaveBeenCalledWith('title');
  });

  it('clicks for every button pressed', () => {
    const { click } = setup();
    const button = document.createElement('button');

    document.body.append(button);
    button.click();

    expect(click).toHaveBeenCalledOnce();
  });

  it('clicks for a province picked on the map', () => {
    const { click } = setup();
    const province = document.createElement('div');

    province.className = 'province';
    document.body.append(province);
    province.click();

    expect(click).toHaveBeenCalledOnce();
  });

  it('keeps silent for clicks beside a button', () => {
    const { click } = setup();
    const panel = document.createElement('div');

    document.body.append(panel);
    panel.click();

    expect(click).not.toHaveBeenCalled();
  });
});
