import { html, nothing, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import { AdviceChosenEvent } from './AdviceChosenEvent';
import { MenuChosenEvent } from './MenuChosenEvent';
import type { GamePanelContext, GamePanelViews } from './types';

import styles from './GamePanel.module.scss';

export class GamePanelView extends View<GamePanelContext, GamePanelViews> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <aside class=${styles.root}>
        <header class=${styles.bar}>
          ${this.renderAdviceButton()}
          <button class="${styles.barButton} ${styles.menu}" type="button"
            data-action="menu"
            @click=${() => this.publish(new MenuChosenEvent())}>
            <span class=${styles.barIcon} aria-hidden="true">☰</span>
            Menu
          </button>
        </header>
        ${this.views.provinceInfo.template}
        ${this.views.provinceCommands.template}
      </aside>
    `;
  }

  public enableAdvice(enabled: boolean): void {
    const advice = this.adviceButton;

    if (advice) {
      advice.disabled = !enabled;
    }
  }

  public focusAdvice(): void {
    this.adviceButton?.focus();
  }

  private renderAdviceButton(): TemplateResult | typeof nothing {
    const { advisor } = this.context.world.campaign;

    return advisor
      ? html`
          <button class=${styles.barButton} type="button" data-action="advice"
            title=${`Ask ${advisor.name} for advice`} disabled
            @click=${() => this.publish(new AdviceChosenEvent())}>
            <span class=${styles.barIcon} aria-hidden="true">?</span>
            Advisor
          </button>
        `
      : nothing;
  }

  private get adviceButton(): HTMLButtonElement | null {
    return this.element.querySelector<HTMLButtonElement>(
      'button[data-action="advice"]',
    );
  }
}
