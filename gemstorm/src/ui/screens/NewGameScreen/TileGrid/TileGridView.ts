import { html, nothing, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import { TileSelectedEvent } from './events/TileSelectedEvent';

import styles from './TileGrid.module.scss';

export interface Tile {
  readonly key: string;
  readonly label: string;
  readonly image?: string;
}

export type TilePicture = 'emblem' | 'portrait' | 'none';

export interface TileGridContext {
  readonly name: string;
  readonly size: number;
  readonly picture: TilePicture;
}

const PICTURE_CLASSES: Readonly<Record<TilePicture, string | undefined>> = {
  emblem: styles.emblem,
  portrait: styles.portrait,
  none: undefined,
};

export class TileGridView extends View<TileGridContext> {
  protected readonly rootClass = styles.root!;

  protected override get rootSelector(): string {
    return `[data-tile-grid="${this.context.name}"]`;
  }

  public get template(): TemplateResult {
    const { name, size } = this.context;
    const slots = Array.from({ length: size }, () => this.renderSlot());

    return html`<ol class=${styles.root} data-tile-grid=${name}>${slots}</ol>`;
  }

  public showTiles(tiles: readonly Tile[]): void {
    for (const [index, button] of this.buttons.entries()) {
      const tile = tiles[index];

      if (tile) {
        button.dataset.key = tile.key;
        button.querySelector('[data-label]')!.textContent = tile.label;
        this.showImage(button, tile.image);
      }
    }
  }

  public showSelected(key: string): void {
    for (const button of this.buttons) {
      const isSelected = button.dataset.key === key;

      button.classList.toggle(styles.selected!, isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    }
  }

  private renderSlot(): TemplateResult {
    return html`
      <li>
        <button class=${styles.tile} data-tile aria-pressed="false"
          @click=${(event: Event) => this.selectTile(event)}>
          ${this.renderPicture()}
          <span class=${styles.label} data-label></span>
        </button>
      </li>
    `;
  }

  private renderPicture(): TemplateResult | typeof nothing {
    const pictureClass = PICTURE_CLASSES[this.context.picture];

    return pictureClass
      ? html`<img class=${pictureClass} data-image alt="" />`
      : nothing;
  }

  private showImage(
    button: HTMLButtonElement,
    image: string | undefined,
  ): void {
    const picture = button.querySelector<HTMLImageElement>('[data-image]');

    if (picture && image) {
      picture.src = image;
    }
  }

  private selectTile(event: Event): void {
    if (event.currentTarget instanceof HTMLButtonElement) {
      const { key } = event.currentTarget.dataset;

      if (key) {
        this.publish(new TileSelectedEvent(key));
      }
    }
  }

  private get buttons(): readonly HTMLButtonElement[] {
    return [...this.element.querySelectorAll<HTMLButtonElement>('[data-tile]')];
  }
}
