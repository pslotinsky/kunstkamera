import { html, type TemplateResult } from 'lit-html';

import type { General, GeneralRank } from '@/core/domain/General';
import type { Province, ProvinceStatus } from '@/core/domain/Province';
import { View } from '@/lib/View';

import { FamilyOverviewClosedEvent } from './FamilyOverviewClosedEvent';
import { FamilyOverviewTabSelectedEvent } from './FamilyOverviewTabSelectedEvent';
import type { FamilyOverviewContext } from './types';

import styles from './FamilyOverview.module.scss';

export type FamilyOverviewMode = 'general' | 'land';

export interface GeneralRow {
  readonly general: General;
  readonly province: Province;
  readonly rank: GeneralRank;
  readonly fame: number | undefined;
  readonly age: number;
}

const TABS: Tab[] = [
  { mode: 'general', label: 'General' },
  { mode: 'land', label: 'Land' },
];

interface Tab {
  readonly mode: FamilyOverviewMode;
  readonly label: string;
}

const STATUS_LABELS: Record<ProvinceStatus, string> = {
  capital: 'Capital',
  remote: 'Ruled remotely',
  lorded: 'Lord',
  unruled: '—',
};

export class FamilyOverviewView extends View<FamilyOverviewContext> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <section class="${styles.root} ${styles.hidden}">
        <header class=${styles.header}>
          <div class=${styles.tabs}>
            ${TABS.map(
              ({ mode, label }) => html`<button
                class=${styles.tab}
                type="button"
                data-mode=${mode}
                @click=${() => this.publish(new FamilyOverviewTabSelectedEvent(mode))}
              >
                ${label}
              </button>`,
            )}
          </div>
          <button
            class=${styles.close}
            type="button"
            @click=${() => this.publish(new FamilyOverviewClosedEvent())}
          >
            Close
          </button>
        </header>
        <div class=${styles.body} data-body></div>
      </section>
    `;
  }

  public show(): void {
    this.element.classList.remove(styles.hidden!);
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  public selectTab(mode: FamilyOverviewMode): void {
    for (const button of this.tabButtons) {
      button.classList.toggle(styles.active!, button.dataset.mode === mode);
    }
  }

  public showGeneral(rows: readonly GeneralRow[]): void {
    this.body.innerHTML = this.renderTable(
      ['', 'INT', 'WAR', 'CHA', 'Fame', 'Province'],
      rows.map((row) => [
        this.renderGeneralCard(row),
        String(row.general.stats.intelligence),
        String(row.general.stats.war),
        String(row.general.stats.charisma),
        row.fame === undefined ? '' : String(row.fame),
        String(row.province),
      ]),
    );
  }

  private renderGeneralCard(row: GeneralRow): string {
    const { general } = row;

    return `
      <div class="${styles.card}">
        <img class="${styles.portrait}" src="${general.portrait}" alt="${general.name}" />
        <div class="${styles.identity}">
          <span class="${styles.title}">${row.rank}</span>
          <span class="${styles.name}">${general.name}</span>
          <span class="${styles.age}">Age ${row.age}</span>
        </div>
      </div>
    `;
  }

  public showLand(provinces: readonly Province[]): void {
    this.body.innerHTML = this.renderTable(
      ['Status', 'Province', 'Governor', 'Cult', 'Prot', 'Loy'],
      provinces.map((province) => [
        STATUS_LABELS[province.status],
        String(province),
        province.governor?.name ?? '—',
        String(province.development.cultivation),
        String(province.development.protection),
        String(province.development.loyalty),
      ]),
    );
  }

  private renderTable(
    headers: readonly string[],
    rows: readonly string[][],
  ): string {
    const head = headers.map((header) => `<th>${header}</th>`).join('');
    const body = rows
      .map(
        (cells) =>
          `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`,
      )
      .join('');

    return `<table class="${styles.table}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  private get tabButtons(): NodeListOf<HTMLButtonElement> {
    return this.element.querySelectorAll<HTMLButtonElement>('[data-mode]');
  }

  private get body(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-body]')!;
  }
}
