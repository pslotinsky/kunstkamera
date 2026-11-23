import { MAP_WIDTH } from './MapCanvas';

export type Rgb = readonly [number, number, number];

export function paintColor(
  image: ImageData,
  pixels: Uint32Array,
  [red, green, blue]: Rgb,
): ImageData {
  for (const pixel of pixels) {
    image.data[pixel * 4] = red;
    image.data[pixel * 4 + 1] = green;
    image.data[pixel * 4 + 2] = blue;
  }

  return image;
}

export function toColumn(pixel: number): number {
  return pixel % MAP_WIDTH;
}

export function toRow(pixel: number): number {
  return Math.floor(pixel / MAP_WIDTH);
}
