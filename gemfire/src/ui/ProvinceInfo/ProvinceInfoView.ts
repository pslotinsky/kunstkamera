import cultivationIconUrl from '@/assets/icons/cultivation.webp';
import foodIconUrl from '@/assets/icons/food.webp';
import goldIconUrl from '@/assets/icons/gold.webp';
import loyaltyIconUrl from '@/assets/icons/loyalty.webp';
import protectionIconUrl from '@/assets/icons/protection.webp';
import troopsIconUrl from '@/assets/icons/troops.webp';
import type { Province } from '@/core/domain/Province';
import { View } from '@/lib/View';

import type { ProvinceInfoContext } from './types';

import styles from './ProvinceInfo.module.scss';

export class ProvinceInfoView extends View<ProvinceInfoContext> {
  protected readonly rootClass = styles.root!;

  public render(): string {
    return `<section class="${styles.root}">${this.renderHint()}</section>`;
  }

  public showProvince(province: Province): void {
    this.element.innerHTML = this.renderProvince(province);
  }

  public showHint(): void {
    this.element.innerHTML = this.renderHint();
  }

  private renderHint(): string {
    return `<p class="${styles.hint}">Select a province.</p>`;
  }

  private renderProvince(province: Province): string {
    const divider = `<hr class="${styles.divider}" />`;
    const details = province.isOwner(this.context.player)
      ? `${divider}${this.renderDetails(province)}${divider}`
      : '';

    return `
      ${this.renderHeader(province)}
      ${details}
    `;
  }

  private renderDetails(province: Province): string {
    return `
      ${this.renderGovernor(province)}
      ${this.renderStats(province)}
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
          <h2>${ownerName}</h2>
          <h2>${province}</h2>
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
          <h2>${governor.name}</h2>
        </div>
      `
      : '';
  }

  private renderStats(province: Province): string {
    return `
      <div class="${styles.stats}">
        ${this.renderColumn('Resources', [
          this.renderStat(goldIconUrl, 'Gold', province.resources.gold),
          this.renderStat(foodIconUrl, 'Food', province.resources.food),
          this.renderStat(troopsIconUrl, 'Troops', province.resources.troops),
        ])}
        ${this.renderColumn('Development', [
          this.renderStat(
            loyaltyIconUrl,
            'Loyalty',
            province.development.loyalty,
          ),
          this.renderStat(
            cultivationIconUrl,
            'Cultivation',
            province.development.cultivation,
          ),
          this.renderStat(
            protectionIconUrl,
            'Protection',
            province.development.protection,
          ),
        ])}
      </div>
    `;
  }

  private renderStat(iconUrl: string, label: string, value: number): string {
    return `
      <p class="${styles.stat}">
        <img class="${styles.statIcon}" src="${iconUrl}" alt="${label}" title="${label}" />
        <span>${value}</span>
      </p>
    `;
  }

  private renderColumn(title: string, rows: readonly string[]): string {
    return `
      <div class="${styles.column}">
        <h3>${title}</h3>
        ${rows.join('')}
      </div>
    `;
  }
}
