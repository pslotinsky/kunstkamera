import { html, type TemplateResult } from 'lit-html';

import goldIconUrl from '@/assets/icons/gold.webp';
import troopsIconUrl from '@/assets/icons/troops.webp';
import type { HiredUnit, RangePattern } from '@/core/domain/HiredUnit';
import { capitalize } from '@/lib/string/capitalize';
import { isDefined } from '@/lib/value/isDefined';

import { CommandDialogView } from './CommandDialogView';
import { rangeGrid } from './range-grid';
import { UnitFocusedEvent } from './UnitFocusedEvent';

import styles from './HireMonster.module.scss';

export interface UnitDetail {
  readonly unit: HiredUnit;
  readonly affordable: boolean;
}

export class HireMonsterDialogView extends CommandDialogView {
  protected override readonly rootClass = styles.root!;

  protected override get hiddenClass(): string {
    return styles.hidden!;
  }

  public showUnits(hireable: readonly HiredUnit[]): void {
    this.units.innerHTML = hireable.length
      ? hireable.map((unit) => this.renderUnit(unit)).join('')
      : `<p class=${styles.empty}>Nothing to hire here.</p>`;
  }

  public focusUnit(type: string): void {
    for (const unit of this.unitButtons) {
      unit.classList.toggle(styles.selected!, unit.dataset.type === type);
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
      <div class=${styles.units} data-units></div>
      <div class=${styles.detail} data-detail></div>
    `;
  }

  private renderUnit(unit: HiredUnit): string {
    return `
      <button class=${styles.unit} type="button" data-type="${unit.type}">
        <img class=${styles.thumb} src="${unit.portrait}" alt="" />
        <span class=${styles.unitName}>${unit.type}</span>
        <span class=${styles.cost}><img class=${styles.costIcon} src="${goldIconUrl}" alt="gold" />${unit.cost}</span>
      </button>
    `;
  }

  private renderDetail(detail: UnitDetail): string {
    const { unit } = detail;
    const disabled = detail.affordable ? '' : 'disabled';

    return `
      <div class=${styles.top}>
        <img class=${styles.portrait} src="${unit.portrait}" alt="${unit.type}" />
        <div class=${styles.info}>
          <h2 class=${styles.name}>${unit.type}</h2>
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
      <button class=${styles.action} type="button" data-act ${disabled}>Hire</button>
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
        <img class=${styles.preview} src="${unit.preview}" alt="${unit.type}" />
      </div>
    `;
  }

  private onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const unit = target.closest<HTMLElement>('[data-type]');

    if (target.closest('[data-act]')) {
      this.confirm();
    } else if (isDefined(unit?.dataset.type)) {
      this.publish(new UnitFocusedEvent(unit.dataset.type));
    }
  }

  private get units(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-units]')!;
  }

  private get detail(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-detail]')!;
  }

  private get unitButtons(): NodeListOf<HTMLElement> {
    return this.element.querySelectorAll<HTMLElement>('[data-type]');
  }
}
