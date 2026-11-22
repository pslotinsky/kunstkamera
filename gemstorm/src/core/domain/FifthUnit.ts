import { Unit, type UnitParams } from './Unit';

export type { RangePattern } from './Unit';

const WITHDRAWAL_DIVISOR = 10;
const STRENGTH_PER_WAR_LOSS = 50;

export interface FifthUnitParams extends UnitParams {
  readonly description: string;
  readonly strength: number;
}

export class FifthUnit extends Unit {
  public readonly description: string;
  public readonly maximumStrength: number;

  protected currentStrength: number;

  public constructor(params: FifthUnitParams) {
    super(params);
    this.description = params.description;
    this.maximumStrength = params.strength;
    this.currentStrength = params.strength;
  }

  public get strength(): number {
    return this.currentStrength;
  }

  public override get isSpecial(): boolean {
    return true;
  }

  public override get minimumActiveStrength(): number {
    return this.isSpecial
      ? Math.ceil(this.maximumStrength / WITHDRAWAL_DIVISOR)
      : super.minimumActiveStrength;
  }

  public get warPenalty(): number {
    return Math.floor(this.maximumStrength / STRENGTH_PER_WAR_LOSS);
  }

  public get isSpentAfterBattle(): boolean {
    return false;
  }

  public override get consumesFood(): boolean {
    return false;
  }

  public override get hasLivery(): boolean {
    return false;
  }

  public override get isTroops(): boolean {
    return false;
  }

  public override get standsAlone(): boolean {
    return true;
  }
}
