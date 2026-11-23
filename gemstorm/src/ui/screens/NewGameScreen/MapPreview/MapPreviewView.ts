import { html, type TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

import worldMapSvgMarkup from '@/assets/map.svg?raw';
import worldMapImageUrl from '@/assets/map.webp';
import type { Province } from '@/core/domain/Province';
import type { WorldMap } from '@/core/domain/WorldMap';
import { View } from '@/lib/View';
import { MapAmbience } from '@/ui/screens/StrategyScreen/WorldMap/ambience/MapAmbience';
import { ProvinceMarkers } from '@/ui/screens/StrategyScreen/WorldMap/ProvinceMarkers';

import styles from './MapPreview.module.scss';

const HIGHLIGHTED = 'highlighted';

export class MapPreviewView extends View {
  protected readonly rootClass = styles.root!;

  private markers?: ProvinceMarkers;

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root} aria-hidden="true">
        ${unsafeHTML(worldMapSvgMarkup)}
      </div>
    `;
  }

  public showMap(map: WorldMap): void {
    for (const province of map.provinces) {
      this.markers?.place(province);
    }
  }

  public highlight(provinces: readonly Province[]): void {
    const numbers = new Set(provinces.map((province) => province.number));

    for (const region of this.regions) {
      const number = Number(region.dataset.province);

      region.classList.toggle(HIGHLIGHTED, numbers.has(number));
    }
  }

  protected override onMount(): void {
    const svg = this.element.querySelector('svg')!;
    const markers = new ProvinceMarkers(svg);

    this.element.querySelector('image')?.setAttribute('href', worldMapImageUrl);
    new MapAmbience(svg).play(this.lifetime.signal);
    markers.mount();
    this.markers = markers;
  }

  private get regions(): readonly SVGElement[] {
    return [...this.element.querySelectorAll<SVGElement>('.province')];
  }
}
