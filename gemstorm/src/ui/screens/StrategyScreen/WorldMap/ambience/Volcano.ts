const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const SMOKE_FRAME_COUNT = 8;
const SMOKE = { x: 406, y: 721, width: 44, height: 60 };
const CRATER = { cx: 428, cy: 771, rx: 8, ry: 11 };
const FLAME_COUNT = 2;
const GLOW_ID = 'volcano-glow';
const GLOW_STOPS = [
  { offset: '0%', color: '#fff2b0', opacity: '0.95' },
  { offset: '45%', color: '#ff8a1e', opacity: '0.6' },
  { offset: '100%', color: '#ff4a00', opacity: '0' },
];

export class Volcano {
  private readonly group: SVGGElement;

  public constructor(private readonly svg: SVGSVGElement) {
    this.group = createSvgElement('g', { class: 'volcano' });
    this.group.append(
      this.createGlow(),
      this.createSmoke(),
      ...this.createFlames(),
    );
  }

  public mount(): void {
    this.svg.querySelector('#province-regions')?.before(this.group);
  }

  private createGlow(): SVGDefsElement {
    const defs = createSvgElement('defs', {});
    const gradient = createSvgElement('radialGradient', { id: GLOW_ID });

    for (const stop of GLOW_STOPS) {
      gradient.append(
        createSvgElement('stop', {
          offset: stop.offset,
          'stop-color': stop.color,
          'stop-opacity': stop.opacity,
        }),
      );
    }

    defs.append(gradient);

    return defs;
  }

  private createSmoke(): SVGForeignObjectElement {
    const smoke = createSvgElement('foreignObject', {
      class: 'volcano-smoke',
      ...toAttributes(SMOKE),
    });
    const frames = Array.from({ length: SMOKE_FRAME_COUNT }, () =>
      document.createElement('div'),
    );

    smoke.append(...frames);

    return smoke;
  }

  private createFlames(): readonly SVGEllipseElement[] {
    return Array.from({ length: FLAME_COUNT }, () =>
      createSvgElement('ellipse', {
        class: 'volcano-flame',
        fill: `url(#${GLOW_ID})`,
        ...toAttributes(CRATER),
      }),
    );
  }
}

function createSvgElement<Name extends keyof SVGElementTagNameMap>(
  name: Name,
  attributes: Readonly<Record<string, string>>,
): SVGElementTagNameMap[Name] {
  const element = document.createElementNS(SVG_NAMESPACE, name);

  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, value);
  }

  return element;
}

function toAttributes(
  values: Readonly<Record<string, number>>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [name, String(value)]),
  );
}
