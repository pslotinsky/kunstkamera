import type { SoundBoard } from './SoundBoard';
import type { SoundChannel } from './SoundChannel';

const SETTINGS_KEY = 'gemstorm.sound';

interface StoredChannel {
  readonly enabled: boolean;
  readonly volume: number;
}

interface StoredSound {
  readonly master: StoredChannel;
  readonly music: StoredChannel;
  readonly sfx: StoredChannel;
}

export class SoundSettings {
  public constructor(private readonly sounds: SoundBoard) {}

  public restore(): void {
    try {
      const stored = this.storage.getItem(SETTINGS_KEY);

      if (stored) {
        this.apply(JSON.parse(stored) as StoredSound);
      }
    } catch (error) {
      console.debug('[settings] could not restore sound', error);
    }
  }

  public store(): void {
    try {
      this.storage.setItem(SETTINGS_KEY, JSON.stringify(this.capture()));
    } catch (error) {
      console.debug('[settings] could not store sound', error);
    }
  }

  private apply(stored: StoredSound): void {
    const { master, music, sfx } = this.sounds;

    this.applyChannel(master, stored.master);
    this.applyChannel(music, stored.music);
    this.applyChannel(sfx, stored.sfx);
  }

  private applyChannel(channel: SoundChannel, stored: StoredChannel): void {
    channel.setEnabled(stored.enabled);
    channel.setVolume(stored.volume);
  }

  private capture(): StoredSound {
    const { master, music, sfx } = this.sounds;

    return {
      master: this.captureChannel(master),
      music: this.captureChannel(music),
      sfx: this.captureChannel(sfx),
    };
  }

  private captureChannel(channel: SoundChannel): StoredChannel {
    return { enabled: channel.isEnabled, volume: channel.volume };
  }

  private get storage(): Storage {
    return globalThis.localStorage;
  }
}
