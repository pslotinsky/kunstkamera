import type { SoundBoard } from '@/ui/common/sound/SoundBoard';

const CLICKABLE = 'button, .province';

export interface SoundDirectorContext {
  readonly sounds: SoundBoard;
}

export class SoundDirector {
  private readonly context: SoundDirectorContext;
  private readonly lifetime = new AbortController();

  public constructor(context: SoundDirectorContext) {
    this.context = context;
  }

  public listen(): void {
    const { signal } = this.lifetime;

    document.addEventListener('keydown', () => this.sounds.unlock(), {
      signal,
    });
    document.addEventListener('pointerdown', () => this.sounds.unlock(), {
      signal,
    });
    document.addEventListener('click', (event) => this.soundPress(event), {
      signal,
    });

    this.sounds.playMusic('title');
  }

  public stop(): void {
    this.lifetime.abort();
  }

  private get sounds(): SoundBoard {
    return this.context.sounds;
  }

  private soundPress(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Element && target.closest(CLICKABLE)) {
      this.sounds.playClick();
    }
  }
}
