import type { InvasionReport } from '@/core/domain/InvasionReport';

import { MARKER_ANCHORS, type MarkerAnchor } from './markerAnchors';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const CREST_WIDTH = 40;
const CREST_HEIGHT = 50;
const CLASH_RADIUS = 34;

export const MARCH_MS = 1200;
export const CLASH_MS = 700;

export class WarMarch {
  private readonly group: SVGGElement;

  public constructor(private readonly svg: SVGSVGElement) {
    this.group = document.createElementNS(SVG_NAMESPACE, 'g');
    this.group.setAttribute('class', 'war-march');
  }

  public play(report: InvasionReport): void {
    const from = MARKER_ANCHORS[report.source.number];
    const to = MARKER_ANCHORS[report.target.number];
    const crest = report.source.family?.crest;

    this.clear();

    if (from && to && crest) {
      this.svg.append(this.group);
      this.march(this.createCrest(crest, from), from, to);

      if (report.isFought) {
        this.clash(to);
      }
    }
  }

  public clear(): void {
    this.group.replaceChildren();
    this.group.remove();
  }

  private march(
    crest: SVGImageElement,
    from: MarkerAnchor,
    to: MarkerAnchor,
  ): void {
    const offset = `${to.x - from.x}px ${to.y - from.y}px`;

    this.group.append(crest);
    crest.animate?.([{ translate: '0px 0px' }, { translate: offset }], {
      duration: MARCH_MS,
      easing: 'ease-in-out',
      fill: 'forwards',
    });
  }

  private clash(at: MarkerAnchor): void {
    const burst = document.createElementNS(SVG_NAMESPACE, 'circle');

    burst.setAttribute('class', 'war-clash');
    burst.setAttribute('cx', String(at.x));
    burst.setAttribute('cy', String(at.y));
    burst.setAttribute('r', String(CLASH_RADIUS));
    this.group.append(burst);
    burst.animate?.(
      [
        { opacity: 0, scale: 0.2 },
        { opacity: 0, scale: 0.2, offset: 0.6 },
        { opacity: 1, scale: 1.2, offset: 0.8 },
        { opacity: 0, scale: 1.6 },
      ],
      { duration: MARCH_MS + CLASH_MS, fill: 'forwards' },
    );
  }

  private createCrest(href: string, at: MarkerAnchor): SVGImageElement {
    const crest = document.createElementNS(SVG_NAMESPACE, 'image');

    crest.setAttribute('href', href);
    crest.setAttribute('x', String(at.x - CREST_WIDTH / 2));
    crest.setAttribute('y', String(at.y - CREST_HEIGHT / 2));
    crest.setAttribute('width', String(CREST_WIDTH));
    crest.setAttribute('height', String(CREST_HEIGHT));

    return crest;
  }
}
