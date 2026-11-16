import { html, type TemplateResult } from 'lit-html';

import type { Phase } from '@/core/domain/BattleClock';
import type { BattleUnit } from '@/core/domain/BattleUnit';
import type { Clash } from '@/core/domain/Clash';
import { Facing } from '@/core/domain/Facing';
import type { Landscape } from '@/core/domain/Province';
import { countTo } from '@/lib/dom/countTo';
import { View } from '@/lib/View';
import { getPublicAssetUrl } from '@/ui/art/getPublicAssetUrl';
import type { SoundBoard } from '@/ui/sound/SoundBoard';

import { unitPiece } from '../../art/unitPiece';
import { unitPreview } from '../../art/unitPreview';
import { ClashSkippedEvent } from './ClashSkippedEvent';

import styles from './Clash.module.scss';

type Corner = 'striker' | 'target';

const BLOCK_FIGURES = 12;
const FILE_DEPTH = 4;

const SKIES: Readonly<Record<Phase, string>> = {
  sunrise: styles.sunrise!,
  noon: styles.noon!,
  sunset: styles.sunset!,
  midnight: styles.midnight!,
};

export interface ClashContext {
  readonly sounds: SoundBoard;
}

export class ClashView extends View<ClashContext> {
  protected readonly rootClass = styles.root!;

  private landscape: Landscape = 'woods';
  private phase: Phase = 'noon';

  public get template(): TemplateResult {
    return html`
      <div
        class="${styles.root} ${styles.hidden}"
        data-clash
        @click=${() => this.publish(new ClashSkippedEvent())}
      >
        <div class=${styles.sky} data-sky></div>
        <div class=${styles.backdrop} data-backdrop></div>
        <div class="${styles.rank} ${styles.striker}" data-rank="striker"></div>
        <div class="${styles.rank} ${styles.target}" data-rank="target"></div>
        <div class=${styles.banner}>
          <img class=${styles.face} data-face="striker" alt="" />
          <span class=${styles.name} data-name="striker"></span>
          <span class=${styles.tally} data-tally="striker"></span>
          <span class=${styles.versus}>vs</span>
          <span class=${styles.tally} data-tally="target"></span>
          <span class=${styles.name} data-name="target"></span>
          <img class=${styles.face} data-face="target" alt="" />
        </div>
      </div>
    `;
  }

  public showPhase(phase: Phase): void {
    this.phase = phase;
    this.sky.className = `${styles.sky!} ${SKIES[phase]}`;
    this.paintBackdrop();
  }

  public showLandscape(landscape: Landscape): void {
    this.landscape = landscape;
    this.paintBackdrop();
  }

  public show(clash: Clash): void {
    this.calm();
    this.showCorner(
      'striker',
      clash.striker,
      clash.strikerLeft + clash.backlash,
    );
    this.showCorner('target', clash.target, clash.targetLeft + clash.losses);
    this.element.classList.remove(styles.hidden!);
  }

  public strike(): void {
    this.restart(this.rankOf('striker'), styles.striking!);
    this.restart(this.rankOf('target'), styles.struck!);
  }

  public land(clash: Clash): void {
    this.settle('striker', clash.striker, clash.strikerLeft, clash.backlash);
    this.settle('target', clash.target, clash.targetLeft, clash.losses);
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  private showCorner(corner: Corner, unit: BattleUnit, strength: number): void {
    this.faceOf(corner).src = unitPreview(unit.unit);
    this.faceOf(corner).alt = unit.name;
    this.nameOf(corner).textContent = unit.name;
    this.tallyOf(corner).textContent = String(strength);
    this.fillRank(corner, unit, this.countFigures(unit, strength));
  }

  private settle(
    corner: Corner,
    unit: BattleUnit,
    left: number,
    losses: number,
  ): void {
    if (losses > 0) {
      countTo(this.tallyOf(corner), left + losses, left);
      this.thinRank(corner, this.countFigures(unit, left));
    }
  }

  private countFigures(unit: BattleUnit, strength: number): number {
    const share = (BLOCK_FIGURES * strength) / unit.committedStrength;

    if (strength <= 0) {
      return 0;
    }

    if (unit.standsAlone) {
      return 1;
    }

    return Math.min(Math.max(1, Math.round(share)), strength);
  }

  private fillRank(corner: Corner, unit: BattleUnit, figures: number): void {
    const files = this.formUp(figures);
    const drawn = files.map((standing) =>
      this.drawFile(corner, unit, standing),
    );

    this.rankOf(corner).replaceChildren(...drawn);
  }

  private formUp(figures: number): readonly number[] {
    const files = Math.ceil(figures / FILE_DEPTH);

    return [...Array(files).keys()].map((index) =>
      Math.min(FILE_DEPTH, figures - index * FILE_DEPTH),
    );
  }

  private drawFile(
    corner: Corner,
    unit: BattleUnit,
    standing: number,
  ): HTMLElement {
    const source = unitPiece(unit, Facing.east);
    const mirrored = corner === 'target';
    const file = document.createElement('div');

    file.className = styles.file!;
    file.append(
      ...[...Array(standing).keys()].map(() => {
        const figure = document.createElement('img');

        figure.className = styles.figure!;
        figure.src = source;
        figure.alt = '';
        figure.classList.toggle(styles.mirrored!, mirrored);
        figure.classList.toggle(styles.alone!, unit.standsAlone);

        return figure;
      }),
    );

    return file;
  }

  private thinRank(corner: Corner, figures: number): void {
    const files = [...this.rankOf(corner).children];
    const facing = corner === 'striker' ? [...files].reverse() : files;
    const standing = facing.flatMap((file) => [...file.children]);
    const lost = standing.length - figures;

    standing.forEach((figure, index) => {
      figure.classList.toggle(styles.falling!, index < lost);
    });
  }

  private calm(): void {
    this.rankOf('striker').classList.remove(styles.striking!);
    this.rankOf('target').classList.remove(styles.struck!);
  }

  private restart(element: HTMLElement, style: string): void {
    element.classList.remove(style);
    element.getBoundingClientRect();
    element.classList.add(style);
  }

  private paintBackdrop(): void {
    const source = getPublicAssetUrl(
      `landscape/${this.landscape}-${this.phase}.webp`,
    );

    this.backdrop.style.backgroundImage = `url(${source})`;
  }

  private get backdrop(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-backdrop]')!;
  }

  private get sky(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-sky]')!;
  }

  private faceOf(corner: Corner): HTMLImageElement {
    return this.element.querySelector<HTMLImageElement>(
      `[data-face="${corner}"]`,
    )!;
  }

  private nameOf(corner: Corner): HTMLElement {
    return this.element.querySelector<HTMLElement>(`[data-name="${corner}"]`)!;
  }

  private tallyOf(corner: Corner): HTMLElement {
    return this.element.querySelector<HTMLElement>(`[data-tally="${corner}"]`)!;
  }

  private rankOf(corner: Corner): HTMLElement {
    return this.element.querySelector<HTMLElement>(`[data-rank="${corner}"]`)!;
  }
}
