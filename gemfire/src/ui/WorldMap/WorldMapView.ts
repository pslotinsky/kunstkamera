import { html, type TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

import worldMapSvgMarkup from '@/assets/map.svg?raw';
import worldMapImageUrl from '@/assets/map.webp';
import type { InvasionReport } from '@/core/domain/InvasionReport';
import type { Province } from '@/core/domain/Province';
import { View } from '@/lib/View';

import { ProvinceMarkers } from './ProvinceMarkers';
import { ProvinceSelectedEvent } from './ProvinceSelectedEvent';
import type { WorldMapContext } from './types';
import { WarMarch } from './WarMarch';

import styles from './WorldMap.module.scss';

export type Highlighting = 'current' | 'selectable' | 'selected';

const HIGHLIGHTING: readonly Highlighting[] = [
  'current',
  'selectable',
  'selected',
];

export class WorldMapView extends View<WorldMapContext> {
  protected readonly rootClass = styles.root!;

  private provinceElements = new Map<number, SVGGeometryElement>();
  private markers: ProvinceMarkers | undefined;
  private warMarch: WarMarch | undefined;

  public addHighlighting(
    provinceNumber: number,
    highlighting: Highlighting,
  ): void {
    const element = this.provinceElements.get(provinceNumber);

    element?.classList.add(highlighting);
  }

  public dim(dimmed: boolean): void {
    this.element.classList.toggle(styles.dimmed!, dimmed);
    this.element.toggleAttribute('data-dimmed', dimmed);
  }

  public actualizeProvince(province: Province): void {
    this.markers?.actualize(province);
  }

  public showWar(report: InvasionReport): void {
    this.warMarch?.play(report);
  }

  public clearWar(): void {
    this.warMarch?.clear();
  }

  public clearHighlighting(): void {
    for (const element of this.provinceElements.values()) {
      element.classList.remove(...HIGHLIGHTING);
    }
  }

  public get template(): TemplateResult {
    return html`<div class=${styles.root}>${unsafeHTML(worldMapSvgMarkup)}</div>`;
  }

  protected override onMount(): void {
    this.element.querySelector('image')?.setAttribute('href', worldMapImageUrl);
    this.provinceElements = this.createProvinceElements();
    this.renderProvinceMarkers();
    this.element.addEventListener(
      'click',
      (event) => this.handleProvinceClick(event),
      { signal: this.lifetime.signal },
    );
  }

  private renderProvinceMarkers(): void {
    const svg = this.element.querySelector('svg');

    if (!svg) {
      return;
    }

    this.markers = new ProvinceMarkers(svg);

    for (const province of this.context.map.provinces) {
      this.markers.add(province);
    }

    this.markers.mount();
    this.warMarch = new WarMarch(svg);
  }

  private createProvinceElements(): Map<number, SVGGeometryElement> {
    const result = new Map<number, SVGGeometryElement>();

    const elements =
      this.element.querySelectorAll<SVGGeometryElement>('.province');

    for (const element of elements) {
      const provinceNumber = Number(element.dataset.province);
      result.set(provinceNumber, element);
    }

    return result;
  }

  private handleProvinceClick(event: MouseEvent): void {
    if (event.target instanceof Element) {
      const provinceElement = event.target.closest<SVGElement>('.province');

      if (provinceElement) {
        const provinceNumber = Number(provinceElement.dataset.province);
        this.publish(new ProvinceSelectedEvent(provinceNumber));
      }
    }
  }
}
