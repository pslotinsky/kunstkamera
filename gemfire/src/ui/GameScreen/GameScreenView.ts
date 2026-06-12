import type { CalendarDate } from '@/core/domain/CalendarDate';
import type { Province } from '@/core/domain/Province';
import { View } from '@/lib/View';

import type { GameScreenContext, GameScreenViews } from './types';

import styles from './GameScreen.module.scss';

export class GameScreenView extends View<GameScreenContext, GameScreenViews> {
  protected readonly rootClass = styles.root!;

  public render(): string {
    const { views, context } = this;
    const { current, turnNumber } = context.world.turnQueue;
    const status = current ? this.renderTurn(current, turnNumber) : '';

    return `
      <div class="${styles.root}">
        ${views.gamePanel.render()}
        <div class="${styles.mapArea}">
          <div class="${styles.turnStatus}">
            <p class="${styles.date}">${context.world.date}</p>
            <p class="${styles.status}">${status}</p>
          </div>
          ${views.worldMap.render()}
        </div>
      </div>
    `;
  }

  public showDate(date: CalendarDate): void {
    this.setText(styles.date!, String(date));
  }

  public showTurn(province: Province, turnNumber: number): void {
    this.setText(styles.status!, this.renderTurn(province, turnNumber));
  }

  private renderTurn(province: Province, turnNumber: number): string {
    return `Turn ${turnNumber}: ${province.name}`;
  }

  private setText(className: string, text: string): void {
    const element = this.element.querySelector(`.${className}`);

    if (element) {
      element.textContent = text;
    }
  }
}
