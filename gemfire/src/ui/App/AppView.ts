import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import type { AppContext, AppViews } from './types';

import styles from './App.module.scss';

export class AppView extends View<AppContext, AppViews> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <div class=${styles.root}>
        ${views.gameScreen.template} ${views.battleScreen.template}
      </div>
    `;
  }
}
