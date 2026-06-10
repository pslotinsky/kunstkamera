import type { General } from './General';
import type { Province } from './Province';

export interface FamilyParams {
  readonly name: string;
  readonly color: string;
  readonly ruler?: General | undefined;
  readonly members?: readonly General[];
  readonly homeProvince?: Province | undefined;
  readonly fame?: number;
}

export class Family {
  public readonly name: string;
  public readonly color: string;
  public ruler?: General | undefined;
  public readonly members: readonly General[];
  public homeProvince?: Province | undefined;
  public fame: number;
  public ally?: Family;

  public constructor(params: FamilyParams) {
    this.name = params.name;
    this.color = params.color;
    this.ruler = params.ruler;
    this.members = params.members ?? [];
    this.homeProvince = params.homeProvince;
    this.fame = params.fame ?? 0;
  }

  public get crest(): string {
    return `/crests/${this.name.toLowerCase()}.png`;
  }

  public isEqual(other: Family): boolean {
    return this.name === other.name;
  }
}
