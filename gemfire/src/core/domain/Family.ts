import { isDefined } from '@/lib/value/isDefined';

import type { General } from './General';
import type { Province } from './Province';

export interface FamilyParams {
  readonly name: string;
  readonly ruler: General;
  readonly members: readonly General[];
  readonly homeProvince: Province;
  readonly fame?: number;
}

export class Family {
  public readonly name: string;
  public ruler: General;
  public readonly members: readonly General[];
  public homeProvince: Province;
  public fame: number;
  public ally?: Family;

  public constructor(params: FamilyParams) {
    this.name = params.name;
    this.ruler = params.ruler;
    this.members = params.members;
    this.homeProvince = params.homeProvince;
    this.fame = params.fame ?? 0;
  }

  public get crest(): string {
    return `/crests/${this.name.toLowerCase()}.png`;
  }

  public isRuler(general: General | undefined): boolean {
    return isDefined(general) && this.ruler.isEqual(general);
  }

  public moveHome(province: Province): void {
    this.homeProvince = province;
    province.assignGovernor(this.ruler);
  }

  public isEqual(other: Family): boolean {
    return this.name === other.name;
  }
}
