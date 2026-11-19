import { Control } from '@/lib/Control';

import { MouseLeaveEvent } from './events/MouseLeaveEvent';
import { MouseMoveEvent } from './events/MouseMoveEvent';
import { SceneView } from './SceneView';

const STILL = '(prefers-reduced-motion: reduce)';
const MAX_FRAME_MS = 64;
const FIRST_FRAME_MS = 16;
const EASING_MS = 160;
const SETTLED = 0.001;

export class SceneControl extends Control<SceneView> {
  private reducedMotion?: MediaQueryList;
  private frame?: number | undefined;
  private lastTime = 0;
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private paused = false;

  public constructor() {
    super(SceneView, {});
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    this.refresh();
  }

  protected override onMount(): void {
    const options = { signal: this.signal };

    this.reducedMotion = window.matchMedia(STILL);
    this.reducedMotion.addEventListener(
      'change',
      () => this.refresh(),
      options,
    );
    document.addEventListener(
      'visibilitychange',
      () => this.refresh(),
      options,
    );
    this.subscribe(MouseMoveEvent, (event) =>
      this.pointAt(event.horizontal, event.vertical),
    );
    this.subscribe(MouseLeaveEvent, () => this.pointAt(0, 0));
    this.refresh();
  }

  protected override onUnmount(): void {
    this.cancelFrame();
  }

  private get isStill(): boolean {
    return (
      (this.reducedMotion?.matches ?? false) || this.paused || document.hidden
    );
  }

  private pointAt(horizontal: number, vertical: number): void {
    if (!this.isStill) {
      this.targetX = horizontal;
      this.targetY = vertical;
      this.schedule();
    }
  }

  private refresh(): void {
    const still = this.isStill;

    this.view.setPaused(still);

    if (still) {
      this.cancelFrame();
      this.currentX = 0;
      this.currentY = 0;
      this.draw();
    } else {
      this.schedule();
    }
  }

  private schedule(): void {
    if (this.frame === undefined) {
      this.frame = requestAnimationFrame((time) => this.animate(time));
    }
  }

  private animate(time: number): void {
    const elapsed = this.lastTime
      ? Math.min(time - this.lastTime, MAX_FRAME_MS)
      : FIRST_FRAME_MS;
    const smoothing = 1 - Math.exp(-elapsed / EASING_MS);

    this.frame = undefined;
    this.lastTime = time;
    this.currentX += (this.targetX - this.currentX) * smoothing;
    this.currentY += (this.targetY - this.currentY) * smoothing;
    this.draw();

    if (this.isSettled) {
      this.lastTime = 0;
    } else {
      this.schedule();
    }
  }

  private get isSettled(): boolean {
    const distance =
      Math.abs(this.targetX - this.currentX) +
      Math.abs(this.targetY - this.currentY);

    return distance <= SETTLED;
  }

  private draw(): void {
    this.view.showParallax(this.currentX, this.currentY);
  }

  private cancelFrame(): void {
    if (this.frame !== undefined) {
      cancelAnimationFrame(this.frame);
      this.frame = undefined;
    }

    this.lastTime = 0;
  }
}
