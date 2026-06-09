import worldMapSvgMarkup from '@/assets/map.svg?raw';
import worldMapImageUrl from '@/assets/map.webp';
import type { Province } from '@/core/domain/Province';
import { Component } from '@/ui/Component';
import { ProvinceSelectedEvent } from './ProvinceSelectedEvent';

export class WorldMapComponent extends Component {
  protected readonly rootClass = 'world-map';

  private provinceElements = new Map<number, SVGElement>();

  public highlight(province: Province): void {
    const neighbors = new Set(province.neighbors);

    for (const [provinceNumber, element] of this.provinceElements) {
      element.classList.toggle('selected', provinceNumber === province.number);
      element.classList.toggle('neighbor', neighbors.has(provinceNumber));
    }
  }

  public clearHighlighting(): void {
    for (const element of this.provinceElements.values()) {
      element.classList.remove('selected', 'neighbor');
    }
  }

  public render(): string {
    return `<div class="${this.rootClass}">${worldMapSvgMarkup}</div>`;
  }

  protected override onMount(): void {
    this.element.querySelector('image')?.setAttribute('href', worldMapImageUrl);
    this.provinceElements = this.createProvinceElements();
    this.element.addEventListener(
      'click',
      (event) => this.handleProvinceClick(event),
      { signal: this.listeners.signal },
    );
  }

  private createProvinceElements(): Map<number, SVGElement> {
    const result = new Map<number, SVGElement>();

    const elements = this.element.querySelectorAll<SVGElement>('.province');
    let provinceNumber;

    for (const element of elements) {
      provinceNumber = Number(element.dataset.province);
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
