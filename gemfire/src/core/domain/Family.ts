import type { General } from './General';
import type { Province } from './Province';

export interface FamilyParams {
  readonly name: string;
  readonly crest: string;
  readonly ruler: General;
  readonly members: General[];
  readonly homeProvince: Province;
  readonly fame: number;
}

export class Family {
  public readonly name: string;
  public readonly crest: string;
  public ruler: General;
  public readonly members: General[];
  public homeProvince: Province;
  public fame: number;
  public ally?: Family;

  public constructor(params: FamilyParams) {
    this.name = params.name;
    this.crest = params.crest;
    this.ruler = params.ruler;
    this.members = params.members;
    this.homeProvince = params.homeProvince;
    this.fame = params.fame;
  }
}
