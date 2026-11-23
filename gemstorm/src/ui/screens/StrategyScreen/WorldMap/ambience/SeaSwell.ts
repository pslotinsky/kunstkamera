import seaMaskUrl from '@/assets/ambience/sea-mask.webp';
import worldMapImageUrl from '@/assets/map.webp';

import { loadImage } from './loadImage';
import { type DrawFrame, MAP_HEIGHT, MAP_WIDTH, MapCanvas } from './MapCanvas';

const LOOP_MS = 4000;
const BAND_HEIGHT = 6;
const BLEED = 6;
const SHIMMER_ALPHA = 0.035;
const CREST_COLOR = '#9cd7ff';
const TROUGH_COLOR = '#001a50';

export class SeaSwell {
  private readonly canvas: MapCanvas;

  public constructor(svg: SVGSVGElement) {
    this.canvas = new MapCanvas(svg, 'sea-swell');
  }

  public play(signal: AbortSignal): void {
    this.canvas.play(signal, (context) => this.prepare(context));
  }

  private async prepare(context: CanvasRenderingContext2D): Promise<DrawFrame> {
    const [map, mask] = await Promise.all([
      loadImage(worldMapImageUrl),
      loadImage(seaMaskUrl),
    ]);

    return (time) => this.draw(context, map, mask, time);
  }

  private draw(
    context: CanvasRenderingContext2D,
    map: HTMLImageElement,
    mask: HTMLImageElement,
    time: number,
  ): void {
    const phase = ((time % LOOP_MS) / LOOP_MS) * Math.PI * 2;

    context.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    for (let top = 0; top < MAP_HEIGHT; top += BAND_HEIGHT) {
      this.drawBand(context, map, top, phase);
    }

    context.globalCompositeOperation = 'destination-in';
    context.drawImage(mask, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    context.globalCompositeOperation = 'source-over';
  }

  private drawBand(
    context: CanvasRenderingContext2D,
    map: HTMLImageElement,
    top: number,
    phase: number,
  ): void {
    const rows = Math.min(BAND_HEIGHT, MAP_HEIGHT - top);
    const shift =
      3.2 * Math.sin(top * 0.029 - phase) + 1.6 * Math.cos(top * 0.048 + phase);
    const wave = Math.sin(top * 0.039 - phase + 0.6);
    const sourceWidth = map.naturalWidth;
    const sourceTop = (top / MAP_HEIGHT) * map.naturalHeight;
    const sourceRows = (rows / MAP_HEIGHT) * map.naturalHeight;

    context.drawImage(
      map,
      0,
      sourceTop,
      sourceWidth,
      sourceRows,
      shift - BLEED,
      top,
      MAP_WIDTH + BLEED * 2,
      rows,
    );
    context.fillStyle = wave > 0 ? CREST_COLOR : TROUGH_COLOR;
    context.globalAlpha = Math.abs(wave) * SHIMMER_ALPHA;
    context.fillRect(0, top, MAP_WIDTH, rows);
    context.globalAlpha = 1;
  }
}
