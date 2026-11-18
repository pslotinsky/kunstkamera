import { describe, expect, it } from 'vitest';

import { SoundChannel } from '@/ui/sound/SoundChannel';

function makeMix() {
  const master = new SoundChannel(0.4);
  const music = new SoundChannel(0.25, master);

  return { master, music };
}

describe('SoundChannel', () => {
  it('scales its full level by the chosen volume', () => {
    const { music } = makeMix();

    music.setVolume(0.5);

    expect(music.level).toBe(0.125);
  });

  it('falls silent when disabled but keeps its volume', () => {
    const { music } = makeMix();

    music.setVolume(0.35);
    music.setEnabled(false);

    expect(music.level).toBe(0);
    expect(music.volume).toBe(0.35);
  });

  it('is neither audible nor adjustable while its parent is disabled', () => {
    const { master, music } = makeMix();

    master.setEnabled(false);

    expect(music.isEnabled).toBe(true);
    expect(music.isAudible).toBe(false);
    expect(music.isAdjustable).toBe(false);
  });
});
