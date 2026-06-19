import { html, nothing, render, type TemplateResult } from 'lit-html';

import cultivationIconUrl from '@/assets/icons/cultivation.webp';
import foodIconUrl from '@/assets/icons/food.webp';
import goldIconUrl from '@/assets/icons/gold.webp';
import loyaltyIconUrl from '@/assets/icons/loyalty.webp';
import protectionIconUrl from '@/assets/icons/protection.webp';
import troopsIconUrl from '@/assets/icons/troops.webp';
import type { DevelopmentKey } from '@/core/domain/Development';
import type { General } from '@/core/domain/General';
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
    return html`<section class=${styles.root}></section>`;
  }

  protected override onMount(): void {
    this.showHint();
  }

  public showHint(): void {
    render(this.renderHint(), this.element);
  }

  public showProvince(province: Province): void {
    render(this.renderProvince(province), this.element);
    this.refreshGovernor(province);
  }

  public actualizeProvince(province: Province): void {
    this.refreshGovernor(province);
    this.animateStats(province.resources);
    this.animateStats(province.development);
  }

  private animateStats(stats: Stats): void {
    for (const [key, value] of stats.entries) {
      this.animateStat(key, value);
    }
  }

  private animateStat(key: string, to: number): void {
    const statElement = this.getStatElement(key);
    const valueElement = statElement?.querySelector('span');

    const from = valueElement ? Number(valueElement.textContent) : 0;

    if (statElement && valueElement && from !== to) {
      statElement.classList.remove(styles.changed!);
      statElement.classList.add(styles.changed!);
      countTo(valueElement, from, to);
    }
  }

  private refreshGovernor(province: Province): void {
    const element = this.governorElement;

    if (element && province.governor) {
      render(this.renderGovernorContent(province.governor), element);
    }
  }

  private renderHint(): TemplateResult {
    return html`<p class=${styles.hint}>Select a province.</p>`;
  }

  private renderProvince(province: Province): TemplateResult {
    return html`
      ${this.renderHeader(province)}
      ${
        province.belongsTo(this.context.player)
          ? html`
              <hr class=${styles.divider} />
              ${this.renderDetails(province)}
              <hr class=${styles.divider} />
            `
          : nothing
      }
    `;
  }

  private renderDetails(province: Province): TemplateResult {
    return html`
      ${province.governor ? html`<div class=${styles.governor}></div>` : nothing}
      ${this.renderStats(province)}
    `;
  }

  private renderHeader(province: Province): TemplateResult {
    const family = province.family;
    const familyName = family?.name ?? 'Neutral';

    return html`
      <header class=${styles.header}>
        ${
          family
            ? html`<img
                class=${styles.crest}
                src=${family.crest}
                alt="${familyName} crest"
              />`
            : nothing
        }
        <div>
          <h2>${familyName}</h2>
          <h2>${String(province)}</h2>
        </div>
      </header>
    `;
  }

  private renderGovernorContent(governor: General): TemplateResult {
    return html`
      <img
        class=${styles.portrait}
        src=${governor.portrait}
        alt=${governor.name}
      />
      <h2>${governor.name}</h2>
    `;
  }

  private renderStats(province: Province): TemplateResult {
    return html`
      <div class=${styles.stats}>
        ${this.renderColumn('Resources', province.resources)}
        ${this.renderColumn('Development', province.development)}
      </div>
    `;
  }

  private renderStat(key: StatKey, value: number): TemplateResult {
    const { icon, label } = STATS_META[key];

    return html`
      <p class=${styles.stat} data-stat=${key}>
        <img class=${styles.statIcon} src=${icon} alt=${label} title=${label} />
        <span>${value}</span>
      </p>
    `;
  }

  private renderColumn(title: string, stats: Stats): TemplateResult {
    return html`
      <div class=${styles.column}>
        <h3>${title}</h3>
        ${stats.entries.map(([key, value]) =>
          this.renderStat(key as StatKey, value),
        )}
      </div>
    `;
  }

  private getStatElement(key: string): HTMLElement | null {
    return this.element.querySelector<HTMLElement>(`[data-stat="${key}"]`);
  }

  private get governorElement(): HTMLElement | null {
    return this.element.querySelector<HTMLElement>(`.${styles.governor}`);
  }
}
