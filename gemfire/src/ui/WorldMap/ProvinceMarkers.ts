import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';

import { MARKER_ANCHORS, type MarkerAnchor } from './markerAnchors';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const CREST_WIDTH = 32;
const CREST_HEIGHT = 40;
const NUMBER_GAP = 14;
const NUMBER_SIZE = 10;
const BLOCK_WIDTH = CREST_WIDTH + NUMBER_GAP + NUMBER_SIZE;
const NUMBER_OFFSET = BLOCK_WIDTH / 2 - NUMBER_SIZE / 2;

export class ProvinceMarkers {
  private readonly group: SVGGElement;

  public constructor(private readonly svg: SVGSVGElement) {
    this.group = document.createElementNS(SVG_NAMESPACE, 'g');
    this.group.setAttribute('class', 'province-markers');
  }

  public add(province: Province): void {
    const anchor = MARKER_ANCHORS[province.number];

    if (anchor) {
      this.group.append(...this.createMarker(province, anchor));
    }
  }

  public mount(): void {
    this.svg.append(this.group);
  }

  private createMarker(province: Province, anchor: MarkerAnchor): SVGElement[] {
    const crest = province.owner
      ? this.createCrest(province.owner, anchor)
      : undefined;

    const number = crest
      ? this.createNumber(province.number, anchor.x + NUMBER_OFFSET, anchor.y)
      : this.createNumber(province.number, anchor.x, anchor.y);

    return crest ? [crest, number] : [number];
  }

  private createCrest(owner: Family, anchor: MarkerAnchor): SVGImageElement {
    const crest = document.createElementNS(SVG_NAMESPACE, 'image');

    crest.setAttribute('href', owner.crest);
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
