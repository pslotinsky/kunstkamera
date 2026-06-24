import { html, type TemplateResult } from 'lit-html';

import type { General, GeneralRank } from '@/core/domain/General';
import type { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province, ProvinceStatus } from '@/core/domain/Province';
import { CommandDialogView } from '@/ui/ProvinceCommands/CommandDialog/CommandDialogView';

import { FamilyOverviewTabSelectedEvent } from './FamilyOverviewTabSelectedEvent';

import styles from './FamilyOverview.module.scss';

export type FamilyOverviewMode = 'general' | 'land' | 'units';

export interface GeneralRow {
  readonly general: General;
  readonly province: Province;
  readonly rank: GeneralRank;
  readonly fame: number | undefined;
  readonly age: number;
}

export interface FifthUnitRow {
  readonly unit: HiredUnit;
  readonly province: Province;
}

const TABS: Tab[] = [
  { mode: 'general', label: 'General' },
  { mode: 'land', label: 'Land' },
  { mode: 'units', label: 'Fifth Units' },
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

export class FamilyOverviewView extends CommandDialogView {
  protected override readonly rootClass = styles.root!;

  protected override get hiddenClass(): string {
    return styles.hidden!;
  }

  protected renderBody(): TemplateResult {
    return html`
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
          @click=${() => this.cancel()}
        >
          Close
        </button>
      </header>
      <div class=${styles.body} data-body></div>
    `;
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
      [
        'Status',
        'Province',
        'Governor',
        'Cultivation',
        'Protection',
        'Loyalty',
      ],
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

  public showFifthUnits(rows: readonly FifthUnitRow[]): void {
    if (rows.length > 0) {
      this.body.innerHTML = this.renderTable(
        ['', 'Strength', 'Province'],
        rows.map((row) => [
          this.renderUnitCard(row.unit),
          String(row.unit.strength),
          String(row.province),
        ]),
      );
    } else {
      this.body.innerHTML = `<p class=${styles.empty}>No Fifth Units hired.</p>`;
    }
  }

  private renderUnitCard(unit: HiredUnit): string {
    return `
      <div class="${styles.card}">
        <img class="${styles.unitPortrait}" src="${unit.portrait}" alt="${unit.type}" />
        <div class="${styles.identity}">
          <span class="${styles.title}">${unit.category}</span>
          <span class="${styles.name}">${unit.type}</span>
        </div>
      </div>
    `;
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
