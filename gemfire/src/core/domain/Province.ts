import { isDefined } from '@/lib/value/isDefined';

import { Characteristics } from './Characteristics';
import { Development, type DevelopmentGains } from './Development';
import type { Family } from './Family';
import type { General } from './General';
import type { HiredUnit } from './HiredUnit';
import { type ResourceGains, Resources } from './Resources';

export type Landscape = 'snow' | 'woods' | 'river' | 'mountain';

export interface ProvinceParams {
  readonly number: number;
  readonly name: string;
  readonly neighbors: readonly number[];
  readonly landscape?: Landscape;
  readonly family?: Family | undefined;
  readonly governor?: General | undefined;
  readonly resources?: Resources;
  readonly development?: Development;
  readonly hirePool?: readonly string[] | undefined;
}

const MAX_GOODWILL = 15;
const ACTIONS_PER_TURN = 3;
const REMOTE_PENALTY = 0.5;

export type ProvinceStatus = 'capital' | 'remote' | 'lorded' | 'unruled';

export class Province {
  public readonly number: number;
  public readonly name: string;
  public readonly neighbors: readonly number[];
  public readonly landscape: Landscape;
  public resources: Resources;
  public development: Development;
  public goodwill = 0;
  public actionCount = 0;
  public governor?: General | undefined;
  public hiredUnits: readonly HiredUnit[] = [];
  public readonly hirePool: readonly string[];

  private house: Family | undefined;

  public constructor(params: ProvinceParams) {
    this.number = params.number;
    this.name = params.name;
    this.neighbors = params.neighbors;
    this.landscape = params.landscape ?? 'woods';
    this.house = params.family;
    this.governor = params.governor;
    this.resources = params.resources ?? Resources.empty();
    this.development = params.development ?? Development.empty();
    this.hirePool = params.hirePool ?? [];
  }

  public get family(): Family | undefined {
    return this.house;
  }

  public claim(family: Family): void {
    this.house = family;
  }

  public unclaim(): void {
    this.house = undefined;
  }

  public assignGovernor(governor: General | undefined): void {
    this.governor = governor;
  }

  public addUnit(unit: HiredUnit): void {
    this.hiredUnits = [...this.hiredUnits, unit];
  }

  public removeUnit(unit: HiredUnit): void {
    this.hiredUnits = this.hiredUnits.filter((stationed) => stationed !== unit);
  }

  public hasUnit(name: string): boolean {
    return this.hiredUnits.some((unit) => unit.name === name);
  }

  public ruledBy(general: General | undefined): boolean {
    return (
      isDefined(general) &&
      isDefined(this.governor) &&
      this.governor.isEqual(general)
    );
  }

  public get isHome(): boolean {
    return isDefined(this.family) && this.isEqual(this.family.homeProvince);
  }

  public get hasLord(): boolean {
    return isDefined(this.governor) && !this.family!.isRuler(this.governor);
  }

  public get isRemotelyRuled(): boolean {
    return this.ruledBy(this.family?.ruler) && !this.isHome;
  }

  public get status(): ProvinceStatus {
    let status: ProvinceStatus = 'unruled';

    if (this.isHome) {
      status = 'capital';
    } else if (this.isRemotelyRuled) {
      status = 'remote';
    } else if (this.hasLord) {
      status = 'lorded';
    }

    return status;
  }

  public get effectiveStats(): Characteristics {
    const stats = this.governor?.stats ?? Characteristics.empty();

    return this.isRemotelyRuled ? stats.multiplyAll(REMOTE_PENALTY) : stats;
  }

  public addResources(gains: ResourceGains): void {
    this.resources = this.resources.increase(gains);
  }

  public addDevelopment(gains: DevelopmentGains): void {
    this.development = this.development.increase(gains);
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
    return this.family?.isEqual(family) ?? false;
  }

  public hasOwner(): boolean {
    return !!this.family;
  }

  public isNeutral(): boolean {
    return !this.hasOwner();
  }

  public toString(): string {
    return `${this.number}: ${this.name}`;
  }
}
