const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const STILL = '(prefers-reduced-motion: reduce)';
const FRAME_MS = 50;

export const MAP_WIDTH = 1448;
export const MAP_HEIGHT = 1086;

export type DrawFrame = (time: number) => void;
export type PrepareFrames = (
  context: CanvasRenderingContext2D,
) => Promise<DrawFrame>;

export class MapCanvas {
  private readonly holder: SVGForeignObjectElement;
  private readonly canvas: HTMLCanvasElement;
  private frame: number | undefined;
  private lastDrawn = Number.NEGATIVE_INFINITY;
  private visibility: IntersectionObserver | undefined;

  public constructor(
    private readonly svg: SVGSVGElement,
    className: string,
  ) {
    this.holder = document.createElementNS(SVG_NAMESPACE, 'foreignObject');
    this.holder.setAttribute('class', `map-canvas ${className}`);
    this.holder.setAttribute('width', String(MAP_WIDTH));
    this.holder.setAttribute('height', String(MAP_HEIGHT));
    this.canvas = document.createElement('canvas');
    this.canvas.width = MAP_WIDTH;
    this.canvas.height = MAP_HEIGHT;
    this.holder.append(this.canvas);
  }

  public play(signal: AbortSignal, prepare: PrepareFrames): void {
    const context = this.canvas.getContext('2d', { willReadFrequently: true });

    this.svg.querySelector('#province-regions')?.before(this.holder);
    signal.addEventListener('abort', () => this.stop(), { once: true });

    if (context) {
      prepare(context).then(
        (draw) => {
          if (!signal.aborted) {
            this.watchVisibility(context, draw);
          }
        },
        () => this.stop(),
      );
    }
  }

  private watchVisibility(
    context: CanvasRenderingContext2D,
    draw: DrawFrame,
  ): void {
    const reducedMotion = window.matchMedia(STILL);

    this.visibility = new IntersectionObserver(([entry]) => {
      this.cancelFrame();

      if (entry?.isIntersecting) {
        this.schedule(context, draw, reducedMotion);
      }
    });
    this.visibility.observe(this.canvas);
  }

  private schedule(
    context: CanvasRenderingContext2D,
    draw: DrawFrame,
    reducedMotion: MediaQueryList,
  ): void {
    this.frame = requestAnimationFrame((time) => {
      const isDue = time - this.lastDrawn >= FRAME_MS;

      if (reducedMotion.matches) {
        context.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
      } else if (isDue) {
        this.lastDrawn = time;
        draw(time);
      }

      this.schedule(context, draw, reducedMotion);
    });
  }

  private cancelFrame(): void {
    if (this.frame !== undefined) {
      cancelAnimationFrame(this.frame);
    }

    this.frame = undefined;
  }

  private stop(): void {
    this.visibility?.disconnect();
    this.cancelFrame();
    this.holder.remove();
  }
}
