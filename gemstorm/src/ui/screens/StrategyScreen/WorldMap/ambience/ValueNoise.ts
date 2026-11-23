const GRID_SIZE = 256;
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const LCG_MODULUS = 4294967296;

export class ValueNoise {
  private readonly grid: Float32Array;

  public constructor(seed: number) {
    let state = seed;

    this.grid = Float32Array.from({ length: GRID_SIZE * GRID_SIZE }, () => {
      state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;

      return state / LCG_MODULUS;
    });
  }

  public sample(x: number, y: number): number {
    const left = Math.floor(x);
    const top = Math.floor(y);
    const across = smooth(x - left);
    const down = smooth(y - top);
    const upperLeft = this.at(left, top);
    const upperRight = this.at(left + 1, top);
    const lowerLeft = this.at(left, top + 1);
    const lowerRight = this.at(left + 1, top + 1);
    const upper = upperLeft + (upperRight - upperLeft) * across;
    const lower = lowerLeft + (lowerRight - lowerLeft) * across;

    return upper + (lower - upper) * down;
  }

  private at(column: number, row: number): number {
    const wrappedColumn = wrap(column);
    const wrappedRow = wrap(row);

    return this.grid[wrappedRow * GRID_SIZE + wrappedColumn]!;
  }
}

function wrap(cell: number): number {
  return ((cell % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
}

function smooth(fraction: number): number {
  return fraction * fraction * (3 - 2 * fraction);
}
