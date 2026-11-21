import { isDefined } from '@/lib/value/isDefined';

import type { Family } from './Family';
import type { General } from './General';
import type { Province } from './Province';

const REDUCED_FAME_DIVISOR = 2;

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
  private readonly deposedFame: number;

  public constructor(params: CoronationParams) {
    this.family = params.family;
    this.deposed = params.deposed;
    this.heirs = params.heirs;
    this.provinces = params.provinces;
    this.deposedFame = params.family.fame;
  }

  public isChoiceFor(family: Family): boolean {
    return this.family.isEqual(family) && this.heirs.length > 1;
  }

  public crown(heir: General): void {
    if (!isDefined(this.heir) && this.heirs.includes(heir)) {
      const home = this.findHome(heir);

      this.reassignProvinces(heir);
      this.family.crown(heir, this.inheritedFame(heir));
      heir.renounceHouse();
      if (isDefined(home)) {
        this.family.moveHome(home);
      }

      this.heir = heir;
    }
  }

  private findHome(heir: General): Province | undefined {
    return (
      this.provinces.find((province) => province.ruledBy(heir)) ??
      this.provinces.find((province) => province.isHome) ??
      this.provinces[0]
    );
  }

  private reassignProvinces(heir: General): void {
    for (const province of this.provinces) {
      if (province.ruledBy(this.deposed)) {
        province.assignGovernor(heir, { preserveEntrust: true });
      }
    }
  }

  private inheritedFame(heir: General): number {
    return heir.stats.charisma >= this.deposed.stats.charisma
      ? this.deposedFame
      : Math.floor(this.deposedFame / REDUCED_FAME_DIVISOR);
  }
}
