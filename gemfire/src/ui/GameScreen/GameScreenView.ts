import { html, type TemplateResult } from 'lit-html';

import type { CalendarDate } from '@/core/domain/CalendarDate';
import type { CampaignOutcome } from '@/core/domain/CampaignOutcome';
import type { Province } from '@/core/domain/Province';
import { View } from '@/lib/View';

import { OverlayToggledEvent } from './OverlayToggledEvent';
import type { GameScreenContext, GameScreenViews } from './types';

import styles from './GameScreen.module.scss';

export class GameScreenView extends View<GameScreenContext, GameScreenViews> {
  protected readonly rootClass = styles.root!;

  private isOverlayOpen = false;

  public get template(): TemplateResult {
    const { views, context } = this;
    const { current, turnNumber } = context.world.turnQueue;
    const status = current ? this.renderTurn(current, turnNumber) : '';

    return html`
      <div class=${styles.root}>
        ${views.gamePanel.template}
        <div class=${styles.mapArea}>
          <div class=${styles.turnStatus}>
            <p class=${styles.date}>${String(context.world.date)}</p>
            <p class=${styles.status}>${status}</p>
          </div>
          ${views.worldMap.template}
          ${views.commandDialogs.template}
          ${views.searchReport.template}
          ${views.battleReport.template}
          ${views.captiveDialog.template}
          ${views.announcements.template}
          ${views.defenseDialog.template}
          ${views.campaignEnding.template}
        </div>
      </div>
    `;
  }

  protected override onMount(): void {
    this.watchOverlays();
  }

  public showEnding(outcome: CampaignOutcome): void {
    this.showDate(outcome.date);
    this.setText(
      styles.status!,
      `${outcome.isVictory ? 'Victory' : 'Defeat'} — ${outcome.house}`,
    );
  }

  public showDate(date: CalendarDate): void {
    this.setText(styles.date!, String(date));
  }

  public showTurn(province: Province, turnNumber: number): void {
    this.setText(styles.status!, this.renderTurn(province, turnNumber));
  }

  private watchOverlays(): void {
    const observer = new MutationObserver(() => this.reportOverlay());

    observer.observe(this.mapArea, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });
    this.disconnectOnUnmount(observer);
  }

  private disconnectOnUnmount(observer: MutationObserver): void {
    this.lifetime.signal.addEventListener(
      'abort',
      () => observer.disconnect(),
      {
        once: true,
      },
    );
  }

  private reportOverlay(): void {
    const isOpen = this.overlays.some((overlay) => overlay.checkVisibility());

    if (isOpen !== this.isOverlayOpen) {
      this.isOverlayOpen = isOpen;
      this.publish(new OverlayToggledEvent(isOpen));
    }
  }

  private get overlays(): readonly HTMLElement[] {
    return [...this.mapArea.querySelectorAll<HTMLElement>('[data-overlay]')];
  }

  private get mapArea(): HTMLElement {
    return this.element.querySelector<HTMLElement>(`.${styles.mapArea}`)!;
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
