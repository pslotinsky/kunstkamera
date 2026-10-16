// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('zzfx', () => ({ ZZFX: undefined }));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('No samples')));
  vi.stubGlobal(
    'AudioContext',
    class {
      public state = 'suspended';
      public currentTime = 0;
      public destination = {};
      public resume = vi.fn(async () => {
        await Promise.resolve();
        this.state = 'running';
      });
      public createMediaElementSource = vi.fn(() => ({ connect: vi.fn() }));
    },
  );
  vi.stubGlobal(
    'GainNode',
    class {
      public connect = vi.fn();
      public gain = {
        value: 1,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      };
    },
  );
});

afterEach(async () => {
  await vi.dynamicImportSettled();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('SoundBoard music', () => {
  it.each(['/', './', '/kunstkamera/gemfire/game/'])(
    'keeps the current track playing across pointer unlocks with base %s',
    async (base) => {
      vi.stubEnv('BASE_URL', base);
      const play = vi
        .spyOn(HTMLMediaElement.prototype, 'play')
        .mockResolvedValue();
      const { SoundBoard } = await import('@/ui/sound/SoundBoard');
      const sounds = new SoundBoard();

      sounds.playMusic('map');
      sounds.unlock();
      await vi.advanceTimersByTimeAsync(0);
      expect(play).toHaveBeenCalledOnce();
      sounds.unlock();
      vi.advanceTimersByTime(1000);

      expect(play).toHaveBeenCalledOnce();
    },
  );

  it('finishes a track change while pointer interactions continue', async () => {
    vi.stubEnv('BASE_URL', './');
    const source = vi.spyOn(HTMLMediaElement.prototype, 'src', 'set');
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue();
    const { SoundBoard } = await import('@/ui/sound/SoundBoard');
    const sounds = new SoundBoard();

    sounds.playMusic('map');
    sounds.unlock();
    await vi.advanceTimersByTimeAsync(0);
    sounds.playMusic('battle');
    vi.advanceTimersByTime(300);
    sounds.unlock();
    vi.advanceTimersByTime(300);

    expect(play).toHaveBeenCalledTimes(2);
    expect(source).toHaveBeenLastCalledWith('./music/battle.mp3');
    sounds.unlock();
    vi.advanceTimersByTime(1000);
    expect(play).toHaveBeenCalledTimes(2);
  });
});
