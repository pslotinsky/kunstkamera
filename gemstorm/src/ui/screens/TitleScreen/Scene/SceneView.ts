import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';
import { getPublicAssetUrl } from '@/ui/common/art/getPublicAssetUrl';

import { MouseLeaveEvent } from './events/MouseLeaveEvent';
import { MouseMoveEvent } from './events/MouseMoveEvent';
import {
  CLOUDS,
  type CloudDrift,
  type FlagPlacement,
  LAYERS,
  PAINTING_HEIGHT,
  PAINTING_WIDTH,
  type SceneLayer,
} from './scene-art';

import styles from './Scene.module.scss';

const FLAG_STAGGER_SECONDS = 0.5;
const VERTICAL_PARALLAX = 0.55;

export class SceneView extends View {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root} aria-hidden="true">
        <div class=${styles.sky}>
          <img class=${styles.painting} src=${getPublicAssetUrl('title/sky.webp')}
            alt="" draggable="false" fetchpriority="high" />
          ${CLOUDS.map((cloud, index) => this.renderCloud(cloud, index))}
        </div>
        ${LAYERS.map((layer) => this.renderLayer(layer))}
        <div class=${styles.shade}></div>
      </div>
    `;
  }

  public setPaused(paused: boolean): void {
    this.element.classList.toggle(styles.paused!, paused);
  }

  public showParallax(horizontal: number, vertical: number): void {
    for (const layer of this.layers) {
      const depth = Number(layer.dataset.depth);
      const x = -horizontal * depth;
      const y = -vertical * depth * VERTICAL_PARALLAX;

      layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }

  protected override onMount(): void {
    const { signal } = this.lifetime;

    document.addEventListener('pointermove', (event) => this.pointAt(event), {
      signal,
    });
    document.documentElement.addEventListener(
      'pointerleave',
      () => this.publish(new MouseLeaveEvent()),
      { signal },
    );
  }

  private renderCloud(cloud: CloudDrift, index: number): TemplateResult {
    const drift = `--width:${cloud.width}%;--top:${cloud.top}%;--duration:${cloud.duration}s;--delay:${cloud.delay}s`;

    return html`
      <img class=${styles.cloud} src=${getPublicAssetUrl(`title/cloud-${index}.webp`)}
        alt="" draggable="false" style=${drift} />
    `;
  }

  private renderLayer(layer: SceneLayer): TemplateResult {
    return html`
      <div class=${styles.layer} data-depth=${layer.depth}>
        <img class=${styles.painting} src=${getPublicAssetUrl(`title/${layer.name}.webp`)}
          alt="" draggable="false" />
        ${layer.flags.map((flag, index) => this.renderFlag(flag, index))}
      </div>
    `;
  }

  private renderFlag(flag: FlagPlacement, index: number): TemplateResult {
    const left = (flag.x / PAINTING_WIDTH) * 100;
    const top = (flag.y / PAINTING_HEIGHT) * 100;
    const width = (flag.width / PAINTING_WIDTH) * 100;
    const delay = -index * FLAG_STAGGER_SECONDS;
    const placement = `left:${left}%;top:${top}%;width:${width}%;animation-delay:${delay}s`;

    return html`
      <img class=${styles.flag} src=${getPublicAssetUrl('title/flag.webp')}
        alt="" draggable="false" style=${placement} />
    `;
  }

  private pointAt(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const bounds = this.element.getBoundingClientRect();
      const horizontal = this.toOffset(
        event.clientX,
        bounds.left,
        bounds.width,
      );
      const vertical = this.toOffset(event.clientY, bounds.top, bounds.height);

      this.publish(new MouseMoveEvent(horizontal, vertical));
    }
  }

  private toOffset(position: number, start: number, size: number): number {
    const offset = ((position - start) / size) * 2 - 1;

    return Math.max(-1, Math.min(1, offset));
  }

  private get layers(): readonly HTMLElement[] {
    return [...this.element.querySelectorAll<HTMLElement>('[data-depth]')];
  }
}
