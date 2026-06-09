import { View } from '@/lib/View';

import type { GamePanelContext, GamePanelViews } from './types';

import styles from './GamePanel.module.scss';

export class GamePanelView extends View<GamePanelContext, GamePanelViews> {
  protected readonly rootClass = styles.root!;

  public render(): string {
    return `
      <aside class="${styles.root}">
        <p class="${styles.date}">${this.context.world.date}</p>
        ${this.views.provinceInfo.render()}
      </aside>
    `;
  }
}
