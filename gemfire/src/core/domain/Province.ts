import { Development, type DevelopmentGains } from './Development';
import type { Family } from './Family';
import type { General } from './General';
import { type ResourceGains, Resources } from './Resources';

export interface ProvinceParams {
  readonly number: number;
  readonly name: string;
  readonly neighbors: readonly number[];
  readonly owner?: Family | undefined;
  readonly governor?: General | undefined;
  readonly resources?: Resources;
  readonly development?: Development;
}

export class Province {
  public readonly number: number;
  public readonly name: string;
  public readonly neighbors: readonly number[];
  public resources: Resources;
  public development: Development;
  public goodwill = 0;
  public actionCount = 0;
  public owner?: Family | undefined;
  public governor?: General | undefined;

  public constructor(params: ProvinceParams) {
    this.number = params.number;
    this.name = params.name;
    this.neighbors = params.neighbors;
    this.owner = params.owner;
    this.governor = params.governor;
    this.resources = params.resources ?? Resources.empty();
    this.development = params.development ?? Development.empty();
  }

  public addResources(gains: ResourceGains): void {
    this.resources = this.resources.add(gains);
  }

  public addDevelopment(gains: DevelopmentGains): void {
    this.development = this.development.add(gains);
  }

  public recordAction(goodwill: number): void {
    this.goodwill = Math.min(15, Math.max(this.goodwill + goodwill, -15));

    if (goodwill) {
      this.actionCount = (this.actionCount + 1) % 3;
    }
  }

  public isEqual(other: Province): boolean {
    return this.number === other.number;
  }

  public isNeighbor(other: Province): boolean {
    return this.neighbors.includes(other.number);
  }

  public isOwner(family: Family): boolean {
    return this.owner?.isEqual(family) ?? false;
  }

  public hasOwner(): boolean {
    return !!this.owner;
  }

  public isNeutral(): boolean {
    return !this.hasOwner();
  }

  public toString(): string {
    return `${this.number}: ${this.name}`;
  }
}
