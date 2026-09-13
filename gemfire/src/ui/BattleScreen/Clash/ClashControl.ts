import type { Phase } from '@/core/domain/BattleClock';
import type { Clash } from '@/core/domain/Clash';
import type { Landscape } from '@/core/domain/Province';
import { Control } from '@/lib/Control';

import { ClashSkippedEvent } from './ClashSkippedEvent';
import { ClashView } from './ClashView';

const ENTER_MS = 800;
const STRIKE_MS = 900;
const LAND_MS = 1600;
const STILL = '(prefers-reduced-motion: reduce)';

export class ClashControl extends Control<ClashView> {
  private onDone?: (() => void) | undefined;
  private beat?: ReturnType<typeof setTimeout> | undefined;

  public constructor() {
    super(ClashView, {});
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

  private strikeOne(clash: Clash): void {
    this.view.strike();
    this.beat = setTimeout(() => this.landOne(clash), STRIKE_MS);
  }

  private landOne(clash: Clash): void {
    this.view.land(clash);
    this.beat = setTimeout(() => this.finish(), LAND_MS);
  }

  private finish(): void {
    const onDone = this.onDone;

    this.stop();
    onDone?.();
  }
}
