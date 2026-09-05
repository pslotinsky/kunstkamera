export type RangePattern = 'short' | 'long' | 'circular' | 'largest';

export interface FifthUnitParams {
  readonly name: string;
  readonly description: string;
  readonly strength: number;
  readonly move: number;
  readonly range: RangePattern;
  readonly flying?: boolean;
}

export class FifthUnit {
  public readonly name: string;
  public readonly description: string;
  public readonly strength: number;
  public readonly move: number;
  public readonly range: RangePattern;
  public readonly flying: boolean;

  public constructor(params: FifthUnitParams) {
    this.name = params.name;
    this.description = params.description;
    this.strength = params.strength;
    this.move = params.move;
    this.range = params.range;
    this.flying = params.flying ?? false;
  }

  public get consumesFood(): boolean {
    return false;
  }

  public get portrait(): string {
    return `/fifth-units/${this.name.toLowerCase()}.webp`;
  }

  public get preview(): string {
    return `/unit/${this.name.toLowerCase()}.webp`;
  }
}
