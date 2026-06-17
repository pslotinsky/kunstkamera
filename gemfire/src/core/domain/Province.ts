import { isDefined } from '@/lib/value/isDefined';

import { Characteristics } from './Characteristics';
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

const MAX_GOODWILL = 15;
const ACTIONS_PER_TURN = 3;
const REMOTE_PENALTY = 0.5;

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

  public assignGovernor(governor: General | undefined): void {
    this.governor = governor;
  }

  public ruledBy(general: General | undefined): boolean {
    return isDefined(this.governor) && this.governor === general;
  }

  public get isHome(): boolean {
    return isDefined(this.owner) && this.isEqual(this.owner.homeProvince);
  }

  public get isRemotelyRuled(): boolean {
    return this.ruledBy(this.owner?.ruler) && !this.isHome;
  }

  public get effectiveStats(): Characteristics {
    const stats = this.governor?.stats ?? Characteristics.empty();

    return this.isRemotelyRuled ? stats.multiplyAll(REMOTE_PENALTY) : stats;
  }

  public addResources(gains: ResourceGains): void {
    this.resources = this.resources.add(gains);
  }

  public addDevelopment(gains: DevelopmentGains): void {
    this.development = this.development.add(gains);
  }

  public recordAction(goodwill: number): void {
    this.goodwill = Math.min(
      MAX_GOODWILL,
      Math.max(this.goodwill + goodwill, -MAX_GOODWILL),
    );

    this.actionCount = (this.actionCount + 1) % ACTIONS_PER_TURN;
  }

  public isEqual(other?: Province | number): boolean {
    return typeof other === 'number'
      ? this.number === other
      : this.number === other?.number;
  }

  public isNeighbor(other: Province): boolean {
    return this.neighbors.includes(other.number);
  }

  public belongsTo(family: Family): boolean {
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
