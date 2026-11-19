import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import { OverlayToggledEvent } from './OverlayToggledEvent';
import type { StrategyScreenContext, StrategyScreenViews } from './types';

import styles from './StrategyScreen.module.scss';

export class StrategyScreenView extends View<
  StrategyScreenContext,
  StrategyScreenViews
> {
  protected readonly rootClass = styles.root!;

  private isOverlayOpen = false;

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <div class=${styles.root}>
        ${views.gamePanel.template}
        <div class=${styles.mapArea}>
          <div class=${styles.turnStatus}>${views.turnStatus.template}</div>
          ${views.worldMap.template}
          ${views.commandDialogs.template}
          ${views.advice.template}
          ${views.searchReport.template}
          ${views.battleReport.template}
          ${views.captiveDialog.template}
          ${views.announcements.template}
          ${views.defenseDialog.template}
          ${views.campaignEnding.template}
        </div>
        ${views.gameMenu.template}
      </div>
    `;
  }

  protected override onMount(): void {
    this.watchOverlays();
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
}
