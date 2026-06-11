import { View } from '@/lib/View';

import type { GameScreenContext, GameScreenViews } from './types';

import styles from './GameScreen.module.scss';

export class GameScreenView extends View<GameScreenContext, GameScreenViews> {
  protected readonly rootClass = styles.root!;

  public render(): string {
    const { views, context } = this;

    return `
      <div class="${styles.root}">
        ${views.gamePanel.render()}
        <div class="${styles.mapArea}">
          <div class="${styles.date}">${context.world.date}</div>
          ${views.worldMap.render()}
        </div>
      </div>
    `;
  }
}
