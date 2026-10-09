import type { Phase } from '@/core/domain/BattleClock';
import type { Clash } from '@/core/domain/Clash';
import type { Landscape } from '@/core/domain/Province';
import { Control } from '@/lib/Control';
import type { SoundBoard } from '@/ui/sound/SoundBoard';

import { ClashSkippedEvent } from './ClashSkippedEvent';
import { type ClashContext, ClashView } from './ClashView';

const ENTER_MS = 800;
const IMPACT_MS = 360;
const STRIKE_MS = 900;
const LAND_MS = 1600;
const STILL = '(prefers-reduced-motion: reduce)';

export class ClashControl extends Control<ClashView> {
  private onDone?: (() => void) | undefined;
  private beat?: ReturnType<typeof setTimeout> | undefined;

  public constructor(context: ClashContext) {
    super(ClashView, context);
  }

  public showPhase(phase: Phase): void {
    this.view.showPhase(phase);
  }

  public showLandscape(landscape: Landscape): void {
    this.view.showLandscape(landscape);
  }

  public play(clash: Clash, onDone: () => void): void {
    this.stop();

    if (this.prefersStill) {
      onDone();
    } else {
      this.onDone = onDone;
      this.view.show(clash);
      this.beat = setTimeout(() => this.strikeOne(clash), ENTER_MS);
    }
  }

  public stop(): void {
    if (this.beat !== undefined) {
      clearTimeout(this.beat);
      this.beat = undefined;
    }

    this.onDone = undefined;
    this.view.hide();
  }

  protected override onMount(): void {
    this.subscribe(ClashSkippedEvent, () => this.finish());
  }

  protected override onUnmount(): void {
    this.stop();
  }

  private get prefersStill(): boolean {
    return window.matchMedia?.(STILL).matches ?? false;
  }

  private get sounds(): SoundBoard {
    return this.context.sounds;
  }

  private strikeOne(clash: Clash): void {
    this.view.strike();
    this.beat = setTimeout(() => this.ringOne(clash), IMPACT_MS);
  }

  private ringOne(clash: Clash): void {
    this.sounds.playStrike(clash.striker.range);
    this.beat = setTimeout(() => this.landOne(clash), STRIKE_MS - IMPACT_MS);
  }

  private landOne(clash: Clash): void {
    this.view.land(clash);
    this.sounds.playBlow();
    this.beat = setTimeout(() => this.finish(), LAND_MS);
  }

  private finish(): void {
    const onDone = this.onDone;

    this.stop();
    onDone?.();
  }
}
