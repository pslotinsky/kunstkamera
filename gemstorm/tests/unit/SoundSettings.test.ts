import { afterEach, describe, expect, it, vi } from 'vitest';

import { SoundBoard } from '@/ui/common/sound/SoundBoard';
import { SoundSettings } from '@/ui/common/sound/SoundSettings';

function stubStorage() {
  const values = new Map<string, string>();

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  });

  return values;
}

function blockStorage(): void {
  const refuse = () => {
    throw new Error('Access denied');
  };

  vi.stubGlobal('localStorage', { getItem: refuse, setItem: refuse });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SoundSettings', () => {
  it('restores the stored switches and volumes on a new board', () => {
    stubStorage();
    const sounds = new SoundBoard();
    sounds.master.setEnabled(false);
    sounds.music.setVolume(0.35);
    sounds.sfx.setEnabled(false);
    sounds.sfx.setVolume(0.6);
    new SoundSettings(sounds).store();

    const restored = new SoundBoard();
    new SoundSettings(restored).restore();

    expect(restored.master.isEnabled).toBe(false);
    expect(restored.music.isEnabled).toBe(true);
    expect(restored.music.volume).toBe(0.35);
    expect(restored.sfx.isEnabled).toBe(false);
    expect(restored.sfx.volume).toBe(0.6);
  });

  it('keeps the defaults when nothing is stored', () => {
    stubStorage();
    const sounds = new SoundBoard();

    new SoundSettings(sounds).restore();

    expect(sounds.master.isEnabled).toBe(true);
    expect(sounds.music.volume).toBe(1);
  });

  it('keeps the defaults when the stored settings are unreadable', () => {
    const values = stubStorage();
    values.set('gemstorm.sound', '{broken');
    const sounds = new SoundBoard();

    new SoundSettings(sounds).restore();

    expect(sounds.music.isEnabled).toBe(true);
    expect(sounds.music.volume).toBe(1);
  });

  it('carries on when the browser blocks storage', () => {
    blockStorage();
    const sounds = new SoundBoard();
    const settings = new SoundSettings(sounds);

    expect(() => settings.restore()).not.toThrow();
    expect(() => settings.store()).not.toThrow();
  });

  it('leaves the save slots alone', () => {
    const values = stubStorage();
    values.set('gemstorm.save.1', 'saved campaign');

    new SoundSettings(new SoundBoard()).store();

    expect(values.get('gemstorm.save.1')).toBe('saved campaign');
  });
});
