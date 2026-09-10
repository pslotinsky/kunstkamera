import { HIRED_UNITS } from '@/config/fifth-units';

import { FifthUnit, type FifthUnitParams } from './FifthUnit';

export type UnitCategory = 'monster' | 'mercenary';

export interface HiredUnitParams extends FifthUnitParams {
  readonly category: UnitCategory;
  readonly cost: number;
  readonly fameToKeep?: number;
}

export class HiredUnit extends FifthUnit {
  public static ofName(name: string): HiredUnit | undefined {
    const definition = HIRED_UNITS.find((unit) => unit.name === name);

    return definition && new HiredUnit(definition);
  }

  public readonly category: UnitCategory;
  public readonly cost: number;
  public readonly fameToKeep: number;

  public override get hasLivery(): boolean {
    return true;
  }

  public constructor(params: HiredUnitParams) {
    super(params);
    this.category = params.category;
    this.cost = params.cost;
    this.fameToKeep = params.fameToKeep ?? 0;
  }

  public override get consumesFood(): boolean {
    return true;
  }

  public getDesertionRisk(fame: number): number {
    return fame < this.fameToKeep
      ? (this.fameToKeep - fame) / this.fameToKeep
      : 0;
  }
}
