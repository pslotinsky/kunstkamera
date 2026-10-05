import type { Family } from './Family';
import type { General } from './General';
import type { Province } from './Province';

export interface CoronationParams {
  readonly family: Family;
  readonly deposed: General;
  readonly heirs: readonly General[];
  readonly provinces: readonly Province[];
}

export class Coronation {
  public readonly family: Family;
  public readonly deposed: General;
  public readonly heirs: readonly General[];
  public readonly provinces: readonly Province[];
  public heir: General | undefined;

  public constructor(params: CoronationParams) {
    this.family = params.family;
    this.deposed = params.deposed;
    this.heirs = params.heirs;
    this.provinces = params.provinces;
  }

  public isChoiceFor(family: Family): boolean {
    return this.family.isEqual(family) && this.heirs.length > 1;
  }

  public crown(heir: General): void {
    if (this.heirs.some((candidate) => candidate.isEqual(heir))) {
      for (const province of this.provinces) {
        province.assignGovernor(heir);
      }

      this.family.crown(heir);
      this.heir = heir;
    }
  }
}
