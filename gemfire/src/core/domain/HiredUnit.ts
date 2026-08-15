import { HIRED_UNITS } from '@/config/fifth-units';

export type UnitCategory = 'monster' | 'mercenary';

export type RangePattern = 'short' | 'long' | 'circular' | 'largest';

export interface HiredUnitParams {
  readonly type: string;
  readonly category: UnitCategory;
  readonly description: string;
  readonly strength: number;
  readonly cost: number;
  readonly move: number;
  readonly range: RangePattern;
  readonly flying?: boolean;
  readonly fameToKeep?: number;
}

export class HiredUnit {
  public static ofType(type: string): HiredUnit | undefined {
    const definition = HIRED_UNITS.find((unit) => unit.type === type);

    return definition && new HiredUnit(definition);
  }

  public readonly type: string;
  public readonly category: UnitCategory;
  public readonly description: string;
  public readonly strength: number;
  public readonly cost: number;
  public readonly move: number;
  public readonly range: RangePattern;
  public readonly flying: boolean;
  public readonly fameToKeep: number;

  public constructor(params: HiredUnitParams) {
    this.type = params.type;
    this.category = params.category;
    this.description = params.description;
    this.strength = params.strength;
    this.cost = params.cost;
    this.move = params.move;
    this.range = params.range;
    this.flying = params.flying ?? false;
    this.fameToKeep = params.fameToKeep ?? 0;
  }

  public get portrait(): string {
    return `/fifth-units/${this.type.toLowerCase()}.webp`;
  }

  public get preview(): string {
    return `/unit/${this.type.toLowerCase()}.webp`;
  }

  public getDesertionRisk(fame: number): number {
    return fame < this.fameToKeep
      ? (this.fameToKeep - fame) / this.fameToKeep
      : 0;
  }
}
