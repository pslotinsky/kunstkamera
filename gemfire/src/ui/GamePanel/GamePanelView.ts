import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import type { GamePanelContext, GamePanelViews } from './types';

import styles from './GamePanel.module.scss';

export class GamePanelView extends View<GamePanelContext, GamePanelViews> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <aside class=${styles.root}>
        ${this.views.provinceInfo.template}
        ${this.views.provinceCommands.template}
      </aside>
    `;
  }
}
