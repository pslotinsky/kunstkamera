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
        <div class=${styles.stage} data-stage></div>
        ${views.titleScreen.template}
        ${views.newStrategyScreen.template}
      </div>
    `;
  }

  public openStage(): HTMLElement {
    const slot = document.createElement('div');

    slot.className = styles.stage!;
    this.stage.replaceChildren(slot);

    return slot;
  }

  public clearStage(): void {
    this.stage.replaceChildren();
  }

  protected override onMount(): void {
    window.addEventListener('resize', () => this.fitFrame(), {
      signal: this.lifetime.signal,
    });
    this.fitFrame();
  }

  private get stage(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-stage]')!;
  }

  private fitFrame(): void {
    const scale = Math.min(
      window.innerWidth / FRAME_WIDTH,
      window.innerHeight / FRAME_HEIGHT,
    );

    this.element.style.setProperty('--frame-scale', String(scale));
  }
}
