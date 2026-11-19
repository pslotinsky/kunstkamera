import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import styles from './Plaque.module.scss';

export interface PlaqueContext {
  readonly name: string;
}

export class PlaqueView extends View<PlaqueContext> {
  protected readonly rootClass = styles.root!;

  protected override get rootSelector(): string {
    return `[data-plaque="${this.context.name}"]`;
  }

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root} data-plaque=${this.context.name}>
        <p class=${styles.title} data-title></p>
        <p class=${styles.caption} data-caption></p>
      </div>
    `;
  }

  public showTitle(title: string): void {
    this.element.querySelector('[data-title]')!.textContent = title;
  }

  public showCaption(caption: string): void {
    this.element.querySelector('[data-caption]')!.textContent = caption;
  }
}
