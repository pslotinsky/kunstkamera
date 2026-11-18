import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import type { AppContext, AppViews } from './types';

import styles from './App.module.scss';

const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

export class AppView extends View<AppContext, AppViews> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <div class=${styles.root}>
        <div class=${styles.campaign} data-campaign inert>
          ${views.gameScreen.template} ${views.battleScreen.template}
        </div>
        ${views.title.template}
      </div>
    `;
  }

  public enterCampaign(): void {
    this.element
      .querySelector<HTMLElement>('[data-campaign]')!
      .removeAttribute('inert');
  }

  protected override onMount(): void {
    window.addEventListener('resize', () => this.fitFrame(), {
      signal: this.lifetime.signal,
    });
    this.fitFrame();
  }

  private fitFrame(): void {
    const scale = Math.min(
      window.innerWidth / FRAME_WIDTH,
      window.innerHeight / FRAME_HEIGHT,
    );

    this.element.style.setProperty('--frame-scale', String(scale));
  }
}
