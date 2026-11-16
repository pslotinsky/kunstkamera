import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';
import { getFamilyCrestUrl } from '@/ui/art/getFamilyCrestUrl';

import { MARKER_ANCHORS, type MarkerAnchor } from './markerAnchors';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const CREST_WIDTH = 32;
const CREST_HEIGHT = 40;
const NUMBER_GAP = 14;
const NUMBER_SIZE = 10;
const BLOCK_WIDTH = CREST_WIDTH + NUMBER_GAP + NUMBER_SIZE;
const NUMBER_OFFSET = BLOCK_WIDTH / 2 - NUMBER_SIZE / 2;
const TOWER_PATH =
  'M0 18 V4 H3 V0 H6 V4 H8 V0 H11 V4 H14 V0 H17 V4 H20 V18 Z M8 18 V12 H12 V18 Z';
const TOWER_OFFSET_X = -10;
const TOWER_OFFSET_Y = -CREST_HEIGHT / 2 - 22;

export class ProvinceMarkers {
  private readonly group: SVGGElement;
  private readonly markers = new Map<number, SVGGElement>();

  public constructor(private readonly svg: SVGSVGElement) {
    this.group = document.createElementNS(SVG_NAMESPACE, 'g');
    this.group.setAttribute('class', 'province-markers');
  }

  public add(province: Province): void {
    const anchor = MARKER_ANCHORS[province.number];

    if (anchor) {
      const marker = document.createElementNS(SVG_NAMESPACE, 'g');

      marker.append(...this.createMarker(province, anchor));
      this.markers.set(province.number, marker);
      this.group.append(marker);
    }
  }

  public actualize(province: Province): void {
    const marker = this.markers.get(province.number);
    const anchor = MARKER_ANCHORS[province.number];

    if (marker && anchor) {
      marker.replaceChildren(...this.createMarker(province, anchor));
    }
  }

  public mount(): void {
    this.svg.append(this.group);
  }

  private createMarker(province: Province, anchor: MarkerAnchor): SVGElement[] {
    const crest = province.family
      ? this.createCrest(province.family, anchor)
      : undefined;

    const number = crest
      ? this.createNumber(province.number, anchor.x + NUMBER_OFFSET, anchor.y)
      : this.createNumber(province.number, anchor.x, anchor.y);

    const markings = crest ? [crest, number] : [number];

    return province.isEntrusted
      ? [...markings, this.createTower(anchor)]
      : markings;
  }

  private createTower(anchor: MarkerAnchor): SVGPathElement {
    const tower = document.createElementNS(SVG_NAMESPACE, 'path');
    const x = anchor.x - BLOCK_WIDTH / 2 + CREST_WIDTH / 2 + TOWER_OFFSET_X;
    const y = anchor.y + TOWER_OFFSET_Y;

    tower.setAttribute('class', 'province-entrusted');
    tower.setAttribute('d', TOWER_PATH);
    tower.setAttribute('transform', `translate(${x} ${y})`);

    return tower;
  }

  private createCrest(owner: Family, anchor: MarkerAnchor): SVGImageElement {
    const crest = document.createElementNS(SVG_NAMESPACE, 'image');

    crest.setAttribute('href', getFamilyCrestUrl(owner));
    crest.setAttribute('x', String(anchor.x - BLOCK_WIDTH / 2));
    crest.setAttribute('y', String(anchor.y - CREST_HEIGHT / 2));
    crest.setAttribute('width', String(CREST_WIDTH));
    crest.setAttribute('height', String(CREST_HEIGHT));

    return crest;
  }

  private createNumber(value: number, x: number, y: number): SVGTextElement {
    const text = document.createElementNS(SVG_NAMESPACE, 'text');

    text.setAttribute('class', 'province-number');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y));
    text.textContent = String(value);

    return text;
  }
}
