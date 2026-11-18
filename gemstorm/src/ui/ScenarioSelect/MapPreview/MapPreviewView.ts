import { html, type TemplateResult } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

import worldMapSvgMarkup from '@/assets/map.svg?raw';
import worldMapImageUrl from '@/assets/map.webp';
import type { WorldMap } from '@/core/domain/WorldMap';
import { View } from '@/lib/View';
import { ProvinceMarkers } from '@/ui/WorldMap/ProvinceMarkers';

import styles from './MapPreview.module.scss';

export interface MapPreviewContext {
  readonly map: WorldMap;
}

export class MapPreviewView extends View<MapPreviewContext> {
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
      this.markers?.actualize(province);
    }
  }

  protected override onMount(): void {
    const svg = this.element.querySelector('svg')!;
    const markers = new ProvinceMarkers(svg);

    this.element.querySelector('image')?.setAttribute('href', worldMapImageUrl);

    for (const province of this.context.map.provinces) {
      markers.add(province);
    }

    markers.mount();
    this.markers = markers;
  }
}
