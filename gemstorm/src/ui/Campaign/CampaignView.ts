import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import type { CampaignContext, CampaignViews } from './types';

import styles from './Campaign.module.scss';

export class CampaignView extends View<CampaignContext, CampaignViews> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <div class=${styles.root}>
        ${views.gameScreen.template}
        ${views.battleScreen.template}
      </div>
    `;
  }
}
