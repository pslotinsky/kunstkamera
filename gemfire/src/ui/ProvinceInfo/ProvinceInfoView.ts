import { html, type TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

import cultivationIconUrl from '@/assets/icons/cultivation.webp';
import foodIconUrl from '@/assets/icons/food.webp';
import goldIconUrl from '@/assets/icons/gold.webp';
import loyaltyIconUrl from '@/assets/icons/loyalty.webp';
import protectionIconUrl from '@/assets/icons/protection.webp';
import troopsIconUrl from '@/assets/icons/troops.webp';
import type { DevelopmentKey } from '@/core/domain/Development';
import type { Province } from '@/core/domain/Province';
import type { ResourceKey } from '@/core/domain/Resources';
import type { Stats } from '@/core/domain/Stats';
import { countTo } from '@/lib/dom/countTo';
import { View } from '@/lib/View';

import type { ProvinceInfoContext } from './types';

import styles from './ProvinceInfo.module.scss';

type StatKey = ResourceKey | DevelopmentKey;

const STATS_META: Record<StatKey, { label: string; icon: string }> = {
  gold: { label: 'Gold', icon: goldIconUrl },
  food: { label: 'Food', icon: foodIconUrl },
  troops: { label: 'Troops', icon: troopsIconUrl },
  loyalty: { label: 'Loyalty', icon: loyaltyIconUrl },
  cultivation: { label: 'Cultivation', icon: cultivationIconUrl },
  protection: { label: 'Protection', icon: protectionIconUrl },
};

export class ProvinceInfoView extends View<ProvinceInfoContext> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`<section class=${styles.root}>
      ${unsafeHTML(this.renderHint())}
    </section>`;
  }

  public showHint(): void {
    this.element.innerHTML = this.renderHint();
  }

  public showProvince(province: Province): void {
    this.element.innerHTML = this.renderProvince(province);
  }

  public actualizeProvince(province: Province): void {
    this.animateStats(province.resources);
    this.animateStats(province.development);
  }

  private animateStats(stats: Stats): void {
    for (const [key, value] of stats.entries) {
      this.animateStat(key, value);
    }
  }

  private animateStat(key: string, to: number): void {
    const statElement = this.element.querySelector(`[data-stat="${key}"]`);
    const valueElement = statElement?.querySelector('span');

    const from = valueElement ? Number(valueElement.textContent) : 0;

    if (statElement && valueElement && from !== to) {
      statElement.classList.remove(styles.changed!);
      statElement.classList.add(styles.changed!);
      countTo(valueElement, from, to);
    }
  }

  private renderHint(): string {
    return `<p class="${styles.hint}">Select a province.</p>`;
  }

  private renderProvince(province: Province): string {
    const divider = `<hr class="${styles.divider}" />`;
    const details = province.isBelongsTo(this.context.player)
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
        ${this.renderColumn('Resources', province.resources)}
        ${this.renderColumn('Development', province.development)}
      </div>
    `;
  }

  private renderStat(key: StatKey, value: number): string {
    const { icon, label } = STATS_META[key];

    return `
      <p class="${styles.stat}" data-stat="${key}">
        <img class="${styles.statIcon}" src="${icon}" alt="${label}" title="${label}" />
        <span>${value}</span>
      </p>
    `;
  }

  private renderColumn(title: string, stats: Stats): string {
    return `
      <div class="${styles.column}">
        <h3>${title}</h3>
        ${stats.entries.map(([key, value]) => this.renderStat(key as StatKey, value)).join('')}
      </div>
    `;
  }
}
