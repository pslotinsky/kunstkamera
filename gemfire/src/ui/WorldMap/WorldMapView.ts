import worldMapSvgMarkup from '@/assets/map.svg?raw';
import worldMapImageUrl from '@/assets/map.webp';
import { View } from '@/lib/View';

import { ProvinceSelectedEvent } from './ProvinceSelectedEvent';
import type { WorldMapContext } from './types';

import styles from './WorldMap.module.scss';

export type Highlighting = 'selected' | 'neighbor';

export class WorldMapView extends View<WorldMapContext> {
  protected readonly rootClass = styles.root!;

  private provinceElements = new Map<number, SVGElement>();

  public addHighlighting(
    provinceNumber: number,
    highlighting: Highlighting,
  ): void {
    const element = this.provinceElements.get(provinceNumber);

    element?.classList.add(highlighting);
  }

  public clearHighlighting(): void {
    for (const element of this.provinceElements.values()) {
      element.classList.remove('selected', 'neighbor');
    }
  }

  public render(): string {
    return `<div class="${styles.root}">${worldMapSvgMarkup}</div>`;
  }

  protected override onMount(): void {
    this.element.querySelector('image')?.setAttribute('href', worldMapImageUrl);
    this.provinceElements = this.createProvinceElements();
    this.applyOwnershipTints();
    this.element.addEventListener(
      'click',
      (event) => this.handleProvinceClick(event),
      { signal: this.listenerSignal },
    );
  }

  private applyOwnershipTints(): void {
    const { provinces } = this.context.map;

    for (const province of provinces) {
      const element = this.provinceElements.get(province.number);

      if (province.owner) {
        element?.style.setProperty('--owner-tint', province.owner.color);
      } else {
        element?.style.removeProperty('--owner-tint');
      }
    }
  }

  private createProvinceElements(): Map<number, SVGElement> {
    const result = new Map<number, SVGElement>();

    const elements = this.element.querySelectorAll<SVGElement>('.province');

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
        this.dispatch(new ProvinceSelectedEvent(provinceNumber));
      }
    }
  }
}
