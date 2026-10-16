import { html, type TemplateResult } from 'lit-html';

import troopsIconUrl from '@/assets/icons/troops.webp';
import type { FifthUnit } from '@/core/domain/FifthUnit';
import type { SearchReportedEvent } from '@/core/events/SearchReportedEvent';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';
import { getFifthUnitPortraitUrl } from '@/ui/art/getFifthUnitPortraitUrl';

import { SearchReportDismissedEvent } from './SearchReportDismissedEvent';

import styles from './SearchReport.module.scss';

export interface SearchReportContext {
  readonly events: EventBus;
}

export class SearchReportView extends View<SearchReportContext> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <section class="${styles.root} ${styles.hidden}" data-overlay>
        <header class=${styles.header}>
          <h2 class=${styles.title} data-title></h2>
          <button
            class=${styles.close}
            type="button"
            @click=${() => this.publish(new SearchReportDismissedEvent())}
          >
            Close
          </button>
        </header>
        <div class=${styles.body} data-units></div>
      </section>
    `;
  }

  public showReport(event: SearchReportedEvent): void {
    const { province, units } = event;
    const house = province.family?.name ?? '';

    this.title.textContent = `Spy report: ${province} (${house})`;
    this.units.innerHTML = units.length
      ? units.map((unit) => this.renderUnit(unit)).join('')
      : `<p class="${styles.empty}">No Fifth Units stationed there.</p>`;
    this.element.classList.remove(styles.hidden!);
    this.closeButton.focus();
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  private renderUnit(unit: FifthUnit): string {
    return `
      <div class="${styles.unit}">
        <img class="${styles.portrait}" src="${getFifthUnitPortraitUrl(unit)}" alt="" />
        <span class="${styles.name}">${unit.name}</span>
        <span class="${styles.strength}">
          <img class="${styles.strengthIcon}" src="${troopsIconUrl}" alt="Strength" />${unit.strength}
        </span>
      </div>
    `;
  }

  private get title(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-title]')!;
  }

  private get units(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-units]')!;
  }

  private get closeButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('button')!;
  }
}
