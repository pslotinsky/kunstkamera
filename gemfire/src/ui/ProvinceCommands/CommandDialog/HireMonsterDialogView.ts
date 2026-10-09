import { html, type TemplateResult } from 'lit-html';

import goldIconUrl from '@/assets/icons/gold.webp';
import troopsIconUrl from '@/assets/icons/troops.webp';
import type { HireMode } from '@/core/commands/province/HireMonsterCommand';
import type { RangePattern } from '@/core/domain/FifthUnit';
import type { HiredUnit } from '@/core/domain/HiredUnit';
import { capitalize } from '@/lib/string/capitalize';
import { isDefined } from '@/lib/value/isDefined';
import { unitPreview } from '@/ui/art/unitPreview';

import { CommandDialogView } from './CommandDialogView';
import { HireModeSelectedEvent } from './HireModeSelectedEvent';
import { rangeGrid } from './range-grid';
import { UnitFocusedEvent } from './UnitFocusedEvent';

import styles from './HireMonster.module.scss';

export interface UnitDetail {
  readonly unit: HiredUnit;
  readonly actionLabel: string;
  readonly enabled: boolean;
}

const MODES: { readonly mode: HireMode; readonly label: string }[] = [
  { mode: 'hire', label: 'Hire' },
  { mode: 'dismiss', label: 'Dismiss' },
];

const EMPTY: Record<HireMode, string> = {
  hire: 'Nothing to hire here.',
  dismiss: 'No units to dismiss.',
};

export class HireMonsterDialogView extends CommandDialogView {
  protected override readonly rootClass = styles.root!;
  protected override readonly isOverlay = true;

  protected override get hiddenClass(): string {
    return styles.hidden!;
  }

  public showMode(mode: HireMode): void {
    for (const button of this.modeButtons) {
      button.classList.toggle(styles.selected!, button.dataset.mode === mode);
    }
  }

  public showUnits(units: readonly HiredUnit[], mode: HireMode): void {
    this.units.innerHTML = units.length
      ? units.map((unit) => this.renderUnit(unit)).join('')
      : `<p class=${styles.empty}>${EMPTY[mode]}</p>`;
  }

  public focusUnit(name: string): void {
    for (const unit of this.unitButtons) {
      unit.classList.toggle(styles.selected!, unit.dataset.unit === name);
    }
  }

  public showDetail(detail: UnitDetail | undefined): void {
    this.detail.innerHTML = detail ? this.renderDetail(detail) : '';
  }

  protected override onMount(): void {
    this.element.addEventListener('click', (event) => this.onClick(event), {
      signal: this.lifetime.signal,
    });
  }

  protected renderBody(): TemplateResult {
    return html`
      <header class=${styles.header}>
        <h2 class=${styles.title}>Hire Monster</h2>
        <button
          class=${styles.close}
          type="button"
          @click=${() => this.cancel()}
        >
          Close
        </button>
      </header>
      <div class=${styles.modes}>
        ${MODES.map(
          ({ mode, label }) => html`<button
            class=${styles.mode}
            type="button"
            data-mode=${mode}
          >
            ${label}
          </button>`,
        )}
      </div>
      <div class=${styles.units} data-units></div>
      <div class=${styles.detail} data-detail></div>
    `;
  }

  private renderUnit(unit: HiredUnit): string {
    return `
      <button class=${styles.unit} type="button" data-unit="${unit.name}">
        <img class=${styles.thumb} src="${unit.portrait}" alt="" />
        <span class=${styles.unitName}>${unit.name}</span>
        <span class=${styles.cost}><img class=${styles.costIcon} src="${goldIconUrl}" alt="gold" />${unit.cost}</span>
      </button>
    `;
  }

  private renderDetail(detail: UnitDetail): string {
    const { unit } = detail;
    const disabled = detail.enabled ? '' : 'disabled';

    return `
      <div class=${styles.top}>
        <img class=${styles.portrait} src="${unit.portrait}" alt="${unit.name}" />
        <div class=${styles.info}>
          <h2 class=${styles.name}>${unit.name}</h2>
          <span class=${styles.kind}>${capitalize(unit.category)}</span>
          <div class=${styles.facts}>
            <span class=${styles.fact}><img class=${styles.factIcon} src="${troopsIconUrl}" alt="Strength" />${unit.strength}</span>
            <span class=${styles.fact}><img class=${styles.factIcon} src="${goldIconUrl}" alt="Cost" />${unit.cost}</span>
          </div>
          <p class=${styles.description}>${unit.description}</p>
        </div>
      </div>
      <div class=${styles.showcase}>
        ${this.renderRange(unit.range)}
        ${this.renderPreview(unit)}
      </div>
      <button class=${styles.action} type="button" data-act ${disabled}>${detail.actionLabel}</button>
    `;
  }

  private renderRange(range: RangePattern): string {
    const rows = rangeGrid(range)
      .map((row) => {
        const cells = row
          .map((cell) => `<td class=${styles.cell} data-cell="${cell}"></td>`)
          .join('');

        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `
      <div class=${styles.range}>
        <span class=${styles.label}>Attack range</span>
        <table class=${styles.grid}>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  private renderPreview(unit: HiredUnit): string {
    return `
      <div class=${styles.previewBox}>
        <span class=${styles.label}>Preview</span>
        <img class=${styles.preview} src="${unitPreview(unit)}" alt="${unit.name}" />
      </div>
    `;
  }

  private onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const mode = target.closest<HTMLElement>('[data-mode]');
    const unit = target.closest<HTMLElement>('[data-unit]');

    if (target.closest('[data-act]')) {
      this.confirm();
    } else if (isDefined(mode?.dataset.mode)) {
      this.publish(new HireModeSelectedEvent(mode.dataset.mode as HireMode));
    } else if (isDefined(unit?.dataset.unit)) {
      this.publish(new UnitFocusedEvent(unit.dataset.unit));
    }
  }

  private get units(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-units]')!;
  }

  private get detail(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-detail]')!;
  }

  private get unitButtons(): NodeListOf<HTMLElement> {
    return this.element.querySelectorAll<HTMLElement>('[data-unit]');
  }

  private get modeButtons(): NodeListOf<HTMLElement> {
    return this.element.querySelectorAll<HTMLElement>('[data-mode]');
  }
}
