import { html, type TemplateResult } from 'lit-html';

import type { CampaignOutcome } from '@/core/domain/CampaignOutcome';
import type { World } from '@/core/domain/World';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';
import { getFamilyCrestUrl } from '@/ui/art/getFamilyCrestUrl';

import { EndingInspectedEvent } from './EndingInspectedEvent';
import { EndingOpenedEvent } from './EndingOpenedEvent';

import styles from './CampaignEnding.module.scss';

export interface CampaignEndingContext {
  readonly world: World;
  readonly events: EventBus;
}

export class CampaignEndingView extends View<CampaignEndingContext> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root}>
        <section class="${styles.panel} ${styles.hidden}" data-ending data-overlay
          role="dialog" aria-modal="true" aria-labelledby="campaign-ending-title">
          <img class=${styles.crest} src=${getFamilyCrestUrl(this.context.world.player)} alt="" />
          <p class=${styles.date} data-ending-date></p>
          <h2 id="campaign-ending-title" class=${styles.title} data-ending-title></h2>
          <p class=${styles.account} data-ending-account></p>
          <button type="button" class=${styles.action} data-inspect
            @click=${() => this.publish(new EndingInspectedEvent())}>
            Inspect the final map
          </button>
        </section>
        <button type="button" class="${styles.reopen} ${styles.hidden}" data-reopen-ending
          @click=${() => this.publish(new EndingOpenedEvent())}>View ending</button>
      </div>
    `;
  }

  protected override onMount(): void {
    this.panel.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') {
          this.publish(new EndingInspectedEvent());
        } else if (event.key === 'Tab') {
          event.preventDefault();
          this.element
            .querySelector<HTMLButtonElement>('[data-inspect]')!
            .focus();
        }
      },
      { signal: this.lifetime.signal },
    );
  }

  public show(outcome: CampaignOutcome): void {
    this.element.querySelector('[data-ending-title]')!.textContent =
      outcome.isVictory ? 'Victory' : 'Defeat';
    this.element.querySelector('[data-ending-date]')!.textContent = String(
      outcome.date,
    );
    this.element.querySelector('[data-ending-account]')!.textContent =
      this.describe(outcome);
    this.panel.classList.remove(styles.hidden!);
    this.reopen.classList.add(styles.hidden!);
    this.element.querySelector<HTMLButtonElement>('[data-inspect]')!.focus();
  }

  public inspect(): void {
    this.panel.classList.add(styles.hidden!);
    this.reopen.classList.remove(styles.hidden!);
    this.reopen.focus();
  }

  private describe(outcome: CampaignOutcome): string {
    const { house, ruler, rival, reason } = outcome;

    switch (reason) {
      case 'unification':
        return `${house} has united Ishmeria under ${ruler}. The island is yours.`;
      case 'last-province-lost':
        return `${house} has lost its last province${rival ? ` to ${rival}` : ''}. ${ruler}'s campaign has ended.`;
      case 'absorption':
        return `${house} has been absorbed${rival ? ` into ${rival}` : ''}. ${ruler} no longer leads an independent house.`;
      case 'no-heir':
        return `${rival ? `${rival} banished ${ruler}, who` : `${ruler} died and`} left no eligible heir. ${house} has disbanded.`;
    }
  }

  private get panel(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-ending]')!;
  }

  private get reopen(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(
      '[data-reopen-ending]',
    )!;
  }
}
