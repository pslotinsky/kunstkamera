import type { Terrain } from './Cell';

export type RangePattern = 'short' | 'long' | 'circular' | 'largest';

const OPEN_GROUND: readonly Terrain[] = ['plains', 'bridge'];
const CLEARED_BY_FLIGHT: readonly Terrain[] = ['woods', 'river', 'fence'];

export interface UnitParams {
  readonly name: string;
  readonly move: number;
  readonly range: RangePattern;
  readonly flying?: boolean;
  readonly builds?: boolean;
}

export abstract class Unit {
  public readonly name: string;
  public readonly move: number;
  public readonly range: RangePattern;
  public readonly flying: boolean;
  public readonly buildsFences: boolean;

  public constructor(params: UnitParams) {
    this.name = params.name;
    this.move = params.move;
    this.range = params.range;
    this.flying = params.flying ?? false;
    this.buildsFences = params.builds ?? false;
  }

  public abstract get consumesFood(): boolean;

  public get hasLivery(): boolean {
    return true;
  }

  public get isTroops(): boolean {
    return true;
  }

  public get standsAlone(): boolean {
    return false;
  }

  public canClear(terrain: Terrain): boolean {
    return (
      OPEN_GROUND.includes(terrain) ||
      (this.flying && CLEARED_BY_FLIGHT.includes(terrain))
    );
  }
}
