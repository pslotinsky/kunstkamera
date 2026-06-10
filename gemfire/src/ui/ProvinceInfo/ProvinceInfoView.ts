import type { Province } from '@/core/domain/Province';
import { View } from '@/lib/View';

import type { ProvinceInfoContext } from './types';

import styles from './ProvinceInfo.module.scss';

export class ProvinceInfoView extends View<ProvinceInfoContext> {
  protected readonly rootClass = styles.root!;

  public render(): string {
    const province = this.context.selection;

    return province ? this.renderProvince(province) : this.renderHint();
  }

  private renderHint(): string {
    return `
      <section class="${styles.root}">
        <p class="${styles.hint}">Select a province.</p>
      </section>
    `;
  }

  private renderProvince(province: Province): string {
    return `
      <section class="${styles.root}">
        ${this.renderHeader(province)}
        ${this.renderGovernor(province)}
        ${this.renderStats(province)}
        ${this.renderNeighbors(province)}
      </section>
    `;
  }

  private renderHeader(province: Province): string {
    const owner = province.owner;
    const ownerName = owner?.name ?? 'Neutral';
    const crest = owner
      ? `<img class="${styles.crest}" src="${owner.crest}" alt="${ownerName} crest" />`
      : '';

    return `
      <header class="${styles.header}">
        ${crest}
        <div>
          <h2>${province}</h2>
          <p>Owner: ${ownerName}</p>
        </div>
      </header>
    `;
  }

  private renderGovernor(province: Province): string {
    const governor = province.governor;

    return governor
      ? `
        <div class="${styles.governor}">
          <img class="${styles.portrait}" src="${governor.portrait}" alt="${governor.name}" />
          <span>Gov: ${governor.name}</span>
        </div>
      `
      : '<p>Gov: —</p>';
  }

  private renderStats(province: Province): string {
    return `
      <div class="${styles.stats}">
        ${this.renderColumn('Resources', [
          `Gold ${province.resources.gold}`,
          `Food ${province.resources.food}`,
          `Troops ${province.resources.troops}`,
        ])}
        ${this.renderColumn('Development', [
          `Loyalty ${province.development.loyalty}`,
          `Cultivation ${province.development.cultivation}`,
          `Protection ${province.development.protection}`,
        ])}
      </div>
    `;
  }

  private renderColumn(title: string, rows: readonly string[]): string {
    return `
      <div class="${styles.column}">
        <h3>${title}</h3>
        ${rows.map((row) => `<p>${row}</p>`).join('')}
      </div>
    `;
  }

  private renderNeighbors(province: Province): string {
    const neighbors = this.context.map.getNeighbors(province);

    return `<p>Neighbors (${neighbors.length}): ${neighbors.join(', ')}</p>`;
  }
}
