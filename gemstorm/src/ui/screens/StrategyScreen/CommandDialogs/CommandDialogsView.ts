import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import type { CommandDialogsContext, CommandDialogsViews } from './types';

import styles from './CommandDialogs.module.scss';

export class CommandDialogsView extends View<
  CommandDialogsContext,
  CommandDialogsViews
> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root}>
        ${Object.values(this.views).map((view) => view.template)}
      </div>
    `;
  }
}
