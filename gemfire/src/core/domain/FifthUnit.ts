import { Unit, type UnitParams } from './Unit';

export type { RangePattern } from './Unit';

export interface FifthUnitParams extends UnitParams {
  readonly description: string;
  readonly strength: number;
}

export class FifthUnit extends Unit {
  public readonly description: string;
  public readonly strength: number;

  public constructor(params: FifthUnitParams) {
    super(params);
    this.description = params.description;
    this.strength = params.strength;
  }

  public override get consumesFood(): boolean {
    return false;
  }

  public override get hasLivery(): boolean {
    return false;
  }

  public get portrait(): string {
    return `/fifth-units/${this.name.toLowerCase()}.webp`;
  }
}
