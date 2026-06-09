import { View } from '@/lib/View';
import type { GameScreenContext, GameScreenViews } from './types';

export class GameScreenView extends View<GameScreenContext, GameScreenViews> {
  protected readonly rootClass = 'game-screen';

  public render(): string {
    return `
      <div class="${this.rootClass}">
        ${this.views.gamePanel.render()}
        ${this.views.worldMap.render()}
      </div>
    `;
  }
}
