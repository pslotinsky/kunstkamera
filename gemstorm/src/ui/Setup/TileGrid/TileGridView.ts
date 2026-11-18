import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import { TileSelectedEvent } from './events/TileSelectedEvent';

import styles from './TileGrid.module.scss';

export interface Tile {
  readonly key: string;
  readonly image: string;
  readonly label: string;
}

export interface TileGridContext {
  readonly name: string;
  readonly size: number;
}

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
        button.querySelector<HTMLImageElement>('[data-image]')!.src =
          tile.image;
        button.querySelector('[data-label]')!.textContent = tile.label;
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
          <img class=${styles.image} data-image alt="" />
          <span class=${styles.label} data-label></span>
        </button>
      </li>
    `;
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
