import riverMaskUrl from '@/assets/ambience/river-mask.webp';

import { loadImage } from './loadImage';
import { type DrawFrame, MAP_HEIGHT, MAP_WIDTH, MapCanvas } from './MapCanvas';
import { paintColor, type Rgb, toColumn, toRow } from './pixelLayer';
import { ValueNoise } from './ValueNoise';

const DRIFT_SCALE = 7;
const RIPPLE_SCALE = 4;
const DRIFT_SPEED = 0.6 / 1000;
const RIPPLE_SPEED = 0.35 / 1000;
const GLINT_FLOOR = 0.3;
const GLINT_RANGE = 0.25;
const PEAK_ALPHA = 0.35;
const DRIFT_SEED = 11;
const RIPPLE_SEED = 23;
const GLINT_COLOR: Rgb = [216, 244, 255];

interface Water {
  readonly pixels: Uint32Array;
  readonly strengths: Float32Array;
}

export class RiverShimmer {
  private readonly canvas: MapCanvas;
  private readonly drift = new ValueNoise(DRIFT_SEED);
  private readonly ripple = new ValueNoise(RIPPLE_SEED);

  public constructor(svg: SVGSVGElement) {
    this.canvas = new MapCanvas(svg, 'river-shimmer');
  }

  public play(signal: AbortSignal): void {
    this.canvas.play(signal, (context) => this.prepare(context));
  }

  private async prepare(context: CanvasRenderingContext2D): Promise<DrawFrame> {
    const mask = await loadImage(riverMaskUrl);

    context.drawImage(mask, 0, 0, MAP_WIDTH, MAP_HEIGHT);

    const water = readWater(context.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT));
    const glints = paintColor(
      context.createImageData(MAP_WIDTH, MAP_HEIGHT),
      water.pixels,
      GLINT_COLOR,
    );

    return (time) => {
      this.draw(glints, water, time);
      context.putImageData(glints, 0, 0);
    };
  }

  private draw(glints: ImageData, water: Water, time: number): void {
    const { pixels, strengths } = water;
    const drifted = time * DRIFT_SPEED;
    const rippled = time * RIPPLE_SPEED;

    for (let index = 0; index < pixels.length; index += 1) {
      const pixel = pixels[index]!;
      const column = toColumn(pixel);
      const row = toRow(pixel);
      const drift = this.drift.sample(
        column / DRIFT_SCALE + drifted,
        row / DRIFT_SCALE,
      );
      const ripple = this.ripple.sample(
        column / RIPPLE_SCALE,
        row / RIPPLE_SCALE - rippled,
      );
      const glint = (drift * ripple * 2 - GLINT_FLOOR) / GLINT_RANGE;
      const alpha = Math.min(1, Math.max(0, glint)) * PEAK_ALPHA;

      glints.data[pixel * 4 + 3] = alpha * strengths[index]!;
    }
  }
}

function readWater(image: ImageData): Water {
  const pixels: number[] = [];
  const strengths: number[] = [];

  for (let pixel = 0; pixel < MAP_WIDTH * MAP_HEIGHT; pixel += 1) {
    const strength = image.data[pixel * 4]!;

    if (strength > 0) {
      pixels.push(pixel);
      strengths.push(strength);
    }
  }

  return {
    pixels: Uint32Array.from(pixels),
    strengths: Float32Array.from(strengths),
  };
}
