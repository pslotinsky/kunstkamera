import type { Family } from '@/core/domain/Family';
import type { World } from '@/core/domain/World';
import { AllianceOfferedEvent } from '@/core/events/AllianceOfferedEvent';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { BattleEndedEvent } from '@/core/events/BattleEndedEvent';
import { BattleStartedEvent } from '@/core/events/BattleStartedEvent';
import { DefenseRequestedEvent } from '@/core/events/DefenseRequestedEvent';
import { GeneralDiedEvent } from '@/core/events/GeneralDiedEvent';
import { SuccessionReportedEvent } from '@/core/events/SuccessionReportedEvent';
import type { EventBus } from '@/lib/EventBus';

import type { SoundBoard } from './SoundBoard';

const CLICKABLE = 'button, .province';

export interface SoundDirectorContext {
  readonly world: World;
  readonly events: EventBus;
  readonly sounds: SoundBoard;
}

export class SoundDirector {
  private readonly context: SoundDirectorContext;
  private readonly lifetime = new AbortController();

  public constructor(context: SoundDirectorContext) {
    this.context = context;
  }

  public listen(): void {
    const { events } = this.context;
    const { signal } = this.lifetime;

    document.addEventListener('pointerdown', () => this.sounds.unlock(), {
      signal,
    });
    document.addEventListener('click', (event) => this.soundPress(event), {
      signal,
    });

    this.sounds.playMusic('map');

    events.subscribe(BattleStartedEvent, () => this.openBattle(), signal);
    events.subscribe(
      BattleEndedEvent,
      () => this.sounds.playMusic('map'),
      signal,
    );
    events.subscribe(
      AllianceOfferedEvent,
      () => this.sounds.playHerald(),
      signal,
    );
    events.subscribe(
      GeneralDiedEvent,
      (event) => this.tollForDeath(event),
      signal,
    );
    events.subscribe(
      SuccessionReportedEvent,
      (event) => this.tollForSuccession(event),
      signal,
    );
    events.subscribe(
      ArtifactFoundEvent,
      () => this.sounds.playGlitter(),
      signal,
    );
    events.subscribe(
      DefenseRequestedEvent,
      () => this.sounds.playAlarm(),
      signal,
    );
  }

  public stop(): void {
    this.lifetime.abort();
  }

  private get sounds(): SoundBoard {
    return this.context.sounds;
  }

  private get player(): Family {
    return this.context.world.player;
  }

  private openBattle(): void {
    this.sounds.playHorn();
    this.sounds.playMusic('battle');
  }

  private soundPress(event: MouseEvent): void {
    const target = event.target;

    if (target instanceof Element && target.closest(CLICKABLE)) {
      this.sounds.playClick();
    }
  }

  private tollForDeath(event: GeneralDiedEvent): void {
    if (event.family?.isEqual(this.player) ?? false) {
      this.sounds.playBell();
    }
  }

  private tollForSuccession(event: SuccessionReportedEvent): void {
    if (event.cause === 'death') {
      this.sounds.playBell();
    }
  }
}
