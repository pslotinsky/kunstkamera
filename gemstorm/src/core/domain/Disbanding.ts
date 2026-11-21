import type { Family } from './Family';
import type { Gem } from './Gem';
import type { General } from './General';
import type { Province } from './Province';

export interface GemInheritance {
  readonly gem: Gem;
  readonly family: Family;
}

export interface DisbandingParams {
  readonly family: Family;
  readonly deposed: General;
  readonly provinces: readonly Province[];
  readonly breakaways: readonly Family[];
  readonly inheritances: readonly GemInheritance[];
}

export class Disbanding {
  public readonly family: Family;
  public readonly deposed: General;
  public readonly provinces: readonly Province[];
  public readonly breakaways: readonly Family[];
  public readonly inheritances: readonly GemInheritance[];

  public constructor(params: DisbandingParams) {
    this.family = params.family;
    this.deposed = params.deposed;
    this.provinces = params.provinces;
    this.breakaways = params.breakaways;
    this.inheritances = params.inheritances;
  }
}
