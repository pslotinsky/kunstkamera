import coastFoamUrl from '@/assets/ambience/coast-foam.webp';

import { loadImage } from './loadImage';
import { type DrawFrame, MAP_HEIGHT, MAP_WIDTH, MapCanvas } from './MapCanvas';
import { paintColor, type Rgb, toColumn, toRow } from './pixelLayer';
import { ValueNoise } from './ValueNoise';

const LOOP_MS = 8000;
const REACH = 14;
const DISTANCE_SCALE = 12;
const DISTANCE_OFFSET = 3;
const LINE_WIDTH = 1.8;
const WAVE_OFFSETS = [0, 0.5];
const PEAK_ALPHA = 0.4 * 255;
const BREAKUP_FLOOR = 0.45;
const BREAKUP_RANGE = 0.3;
const NOISE_CELL = 2;
const NOISE_SEED = 7;
const FOAM_COLOR: Rgb = [235, 248, 255];

interface Shore {
  readonly pixels: Uint32Array;
  readonly distances: Float32Array;
  readonly breakups: Float32Array;
}

export class CoastFoam {
  private readonly canvas: MapCanvas;

  public constructor(svg: SVGSVGElement) {
    this.canvas = new MapCanvas(svg, 'coast-foam');
  }

  public play(signal: AbortSignal): void {
    this.canvas.play(signal, (context) => this.prepare(context));
  }

  private async prepare(context: CanvasRenderingContext2D): Promise<DrawFrame> {
    const data = await loadImage(coastFoamUrl);

    context.drawImage(data, 0, 0, MAP_WIDTH, MAP_HEIGHT);

    const shore = readShore(context.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT));
    const foam = paintColor(
      context.createImageData(MAP_WIDTH, MAP_HEIGHT),
      shore.pixels,
      FOAM_COLOR,
    );

    return (time) => {
      this.draw(foam, shore, time);
      context.putImageData(foam, 0, 0);
    };
  }

  private draw(foam: ImageData, shore: Shore, time: number): void {
    const progress = (time % LOOP_MS) / LOOP_MS;
    const { pixels, distances, breakups } = shore;

    for (let index = 0; index < pixels.length; index += 1) {
      const surf = measureSurf(distances[index]!, progress);
      const alpha = surf * breakups[index]! * PEAK_ALPHA;

      foam.data[pixels[index]! * 4 + 3] = alpha;
    }
  }
}

function measureSurf(distance: number, progress: number): number {
  return WAVE_OFFSETS.reduce((strongest, offset) => {
    const wave = (progress + offset) % 1;
    const line = REACH * (1 - wave);
    const closeness = Math.max(0, 1 - Math.abs(distance - line) / LINE_WIDTH);

    return Math.max(strongest, closeness * Math.sin(Math.PI * wave));
  }, 0);
}

function readShore(image: ImageData): Shore {
  const noise = new ValueNoise(NOISE_SEED);
  const pixels: number[] = [];
  const distances: number[] = [];
  const breakups: number[] = [];

  for (let pixel = 0; pixel < MAP_WIDTH * MAP_HEIGHT; pixel += 1) {
    const encoded = image.data[pixel * 4]!;

    if (encoded > 0) {
      const grain = noise.sample(
        toColumn(pixel) / NOISE_CELL,
        toRow(pixel) / NOISE_CELL,
      );
      const breakup = (grain - BREAKUP_FLOOR) / BREAKUP_RANGE;

      pixels.push(pixel);
      distances.push(encoded / DISTANCE_SCALE - DISTANCE_OFFSET);
      breakups.push(Math.min(1, Math.max(0, breakup)));
    }
  }

  return {
    pixels: Uint32Array.from(pixels),
    distances: Float32Array.from(distances),
    breakups: Float32Array.from(breakups),
  };
}
