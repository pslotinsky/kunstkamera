export interface FlagPlacement {
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

export interface SceneLayer {
  readonly name: string;
  readonly depth: number;
  readonly flags: readonly FlagPlacement[];
  readonly hasRiver: boolean;
}

export interface CloudDrift {
  readonly width: number;
  readonly top: number;
  readonly duration: number;
  readonly delay: number;
}

export const PAINTING_WIDTH = 1672;
export const PAINTING_HEIGHT = 941;

const CASTLE_FLAGS: readonly FlagPlacement[] = [
  { x: 976.5, y: 299, width: 37 },
  { x: 1093.5, y: 228, width: 40 },
  { x: 1202.5, y: 204, width: 30 },
  { x: 1249, y: 188, width: 35 },
  { x: 1353, y: 81, width: 44 },
  { x: 1472, y: 202, width: 35 },
  { x: 1427.5, y: 275, width: 27 },
  { x: 916, y: 423, width: 24 },
];

export const LAYERS: readonly SceneLayer[] = [
  { name: 'landscape', depth: 10, flags: CASTLE_FLAGS, hasRiver: true },
  { name: 'foliage', depth: 18, flags: [], hasRiver: false },
];

export const CLOUDS: readonly CloudDrift[] = [
  { width: 30, top: 3, duration: 170, delay: -42 },
  { width: 33, top: 5, duration: 210, delay: -135 },
  { width: 25, top: 14, duration: 190, delay: -98 },
  { width: 29, top: 21, duration: 230, delay: -20 },
  { width: 24, top: 29, duration: 250, delay: -175 },
  { width: 27, top: 24, duration: 220, delay: -79 },
];
