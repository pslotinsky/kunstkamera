import { View } from '@/lib/View';

import type { GameScreenContext, GameScreenViews } from './types';

import styles from './GameScreen.module.scss';

export class GameScreenView extends View<GameScreenContext, GameScreenViews> {
  protected readonly rootClass = styles.root!;

  public render(): string {
    return `
      <div class="${styles.root}">
        ${this.views.gamePanel.render()}
        ${this.views.worldMap.render()}
      </div>
    `;
  }
}
