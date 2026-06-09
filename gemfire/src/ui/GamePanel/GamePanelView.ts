import './GamePanel.scss';
import { View } from '@/lib/View';
import type { GamePanelContext, GamePanelViews } from './types';

export class GamePanelView extends View<GamePanelContext, GamePanelViews> {
  protected readonly rootClass = 'game-panel';

  public render(): string {
    return `
      <aside class="${this.rootClass}">
        <p class="${this.rootClass}__date">${this.context.world.date}</p>
        ${this.views.provinceInfo.render()}
      </aside>
    `;
  }
}
