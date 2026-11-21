import { isDefined } from '@/lib/value/isDefined';

import { Characteristics } from './Characteristics';
import { Development, type DevelopmentGains } from './Development';
import type { Family } from './Family';
import type { General } from './General';
import { ProvinceFifthUnits } from './ProvinceFifthUnits';
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
const ACTIONS_PER_CYCLE = 3;
const REMOTE_PENALTY = 0.5;
const CULTIVATION_PER_GOVERNOR_GOLD = 5;
const TROOPS_PER_FOOD = 10;
const UNOWNED_PROVINCE_FAME = 3;

export type ProvinceStatus =
  | 'capital'
  | 'remote'
  | 'lorded'
  | 'entrusted'
  | 'unruled';

export class Province {
  public readonly number: number;
  public readonly name: string;
  public readonly neighbors: readonly number[];
  public readonly landscape: Landscape;
  public readonly fifthUnits: ProvinceFifthUnits;
  public resources: Resources;
  public development: Development;
  public goodwill = 0;
  public actionCount = 0;
  public governor?: General | undefined;
  private house: Family | undefined;
  private entrusted = false;

  public constructor(params: ProvinceParams) {
    this.number = params.number;
    this.name = params.name;
    this.neighbors = params.neighbors;
    this.landscape = params.landscape ?? 'woods';
    this.house = params.family;
    this.governor = params.governor;
    this.resources = params.resources ?? Resources.empty();
    this.development = params.development ?? Development.empty();
    this.fifthUnits = new ProvinceFifthUnits(params.hirePool);
  }

  public get family(): Family | undefined {
    return this.house;
  }

  public claim(family: Family): void {
    if (this.house !== family) {
      this.resetActionCycle();
    }
    this.house = family;
    this.entrusted = false;
  }

  public claimUnowned(family: Family, governor = family.ruler): void {
    if (this.isNeutral()) {
      this.claim(family);
      this.assignGovernor(governor);
      family.gainFame(UNOWNED_PROVINCE_FAME);
    }
  }

  public unclaim(): void {
    this.resetActionCycle();
    this.house = undefined;
    this.entrusted = false;
  }

  public assignGovernor(
    governor: General | undefined,
    options: { readonly preserveEntrust?: boolean } = {},
  ): void {
    if (!options.preserveEntrust && !this.ruledBy(governor)) {
      this.entrusted = false;
    }

    this.governor = governor;
  }

  public get isEntrusted(): boolean {
    return this.entrusted;
  }

  public canEntrust(): boolean {
    return this.hasLord && !this.isHome;
  }

  public entrust(): void {
    this.entrusted = this.canEntrust();
  }

  public cancelEntrust(): void {
    this.entrusted = false;
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
    } else if (this.isEntrusted) {
      status = 'entrusted';
    } else if (this.hasLord) {
      status = 'lorded';
    }

    return status;
  }

  public get governorUpkeep(): number {
    const { cultivation } = this.development;

    return isDefined(this.residentGovernor)
      ? Math.floor(cultivation / CULTIVATION_PER_GOVERNOR_GOLD)
      : 0;
  }

  public get residentGovernor(): General | undefined {
    return this.isRemotelyRuled ? undefined : this.governor;
  }

  public get troopFoodUpkeep(): number {
    return Math.floor(this.resources.troops / TROOPS_PER_FOOD);
  }

  public get effectiveStats(): Characteristics {
    const stats = this.governor?.stats ?? Characteristics.empty();

    return this.isRemotelyRuled ? stats.multiplyAll(REMOTE_PENALTY) : stats;
  }

  public addResources(gains: ResourceGains): void {
    this.resources = this.resources.increase(gains);
  }

  public reduceResources(losses: ResourceGains): void {
    this.resources = this.resources.decrease(losses);
  }

  public addDevelopment(gains: DevelopmentGains): void {
    this.development = this.development.increase(gains);
  }

  public reduceDevelopment(losses: DevelopmentGains): void {
    this.development = this.development.decrease(losses);
  }

  public recordAction(goodwill: number): void {
    this.goodwill = Math.min(
      MAX_GOODWILL,
      Math.max(this.goodwill + goodwill, -MAX_GOODWILL),
    );

    this.actionCount = Math.min(this.actionCount + 1, ACTIONS_PER_CYCLE);
  }

  public get isEventDue(): boolean {
    return this.actionCount === ACTIONS_PER_CYCLE;
  }

  public resetActionCycle(): void {
    this.actionCount = 0;
    this.goodwill = 0;
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
