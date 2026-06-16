import worldMapSvgMarkup from '@/assets/map.svg?raw';
import worldMapImageUrl from '@/assets/map.webp';
import { View } from '@/lib/View';

import { ProvinceMarkers } from './ProvinceMarkers';
import { ProvinceSelectedEvent } from './ProvinceSelectedEvent';
import type { WorldMapContext } from './types';

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

  public addHighlighting(
    provinceNumber: number,
    highlighting: Highlighting,
  ): void {
    const element = this.provinceElements.get(provinceNumber);

    element?.classList.add(highlighting);
  }

  public clearHighlighting(): void {
    for (const element of this.provinceElements.values()) {
      element.classList.remove(...HIGHLIGHTING);
    }
  }

  public render(): string {
    return `<div class="${styles.root}">${worldMapSvgMarkup}</div>`;
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

    const markers = new ProvinceMarkers(svg);

    for (const province of this.context.map.provinces) {
      markers.add(province);
    }

    markers.mount();
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
