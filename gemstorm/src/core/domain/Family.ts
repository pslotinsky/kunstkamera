import { isDefined } from '@/lib/value/isDefined';

import type { CalendarDate } from './CalendarDate';
import type { FifthUnit } from './FifthUnit';
import type { Gem } from './Gem';
import type { General } from './General';
import type { Province } from './Province';

const MAX_FAME = 100;

export interface FamilyParams {
  readonly name: string;
  readonly ruler: General;
  readonly members: readonly General[];
  readonly homeProvince: Province;
  readonly fame?: number;
  readonly gems?: readonly Gem[];
  readonly royal?: boolean | undefined;
}

export class Family {
  public readonly name: string;
  public ruler: General;
  public members: readonly General[];
  public homeProvince: Province;
  public gems: readonly Gem[];
  public ally: Family | undefined;
  public readonly royal: boolean;

  private rulerFame: number;

  public constructor(params: FamilyParams) {
    this.name = params.name;
    this.ruler = params.ruler;
    this.members = params.members;
    this.homeProvince = params.homeProvince;
    this.rulerFame = this.clampFame(params.fame ?? 0);
    this.gems = params.gems ?? [];
    this.royal = params.royal ?? false;
  }

  public formAlliance(other: Family): void {
    this.breakAlliance();
    other.breakAlliance();
    this.ally = other;
    other.ally = this;
  }

  public breakAlliance(): void {
    if (this.ally) {
      this.ally.ally = undefined;
      this.ally = undefined;
    }
  }

  public isAlliedWith(other: Family): boolean {
    return this.ally?.isEqual(other) ?? false;
  }

  public isHostileTo(other: Family | undefined): boolean {
    return (
      isDefined(other) && !this.isEqual(other) && !this.isAlliedWith(other)
    );
  }

  public get fame(): number {
    return this.rulerFame;
  }

  public gainFame(amount: number): void {
    this.rulerFame = this.clampFame(this.rulerFame + amount);
  }

  public loseFame(amount: number): void {
    this.rulerFame = this.clampFame(this.rulerFame - amount);
  }

  public crown(heir: General, fame = this.rulerFame): void {
    this.ruler = heir;
    this.rulerFame = this.clampFame(fame);
  }

  public enlist(general: General): void {
    if (!this.members.some((member) => member.isEqual(general))) {
      this.members = [...this.members, general];
    }
  }

  public discharge(general: General): void {
    this.members = this.members.filter((member) => !member.isEqual(general));
  }

  public surrenderTo(victor: Family): void {
    victor.receiveGems(this.gems);
    this.gems = [];
  }

  public receiveGems(gems: readonly Gem[]): void {
    this.gems = [...this.gems, ...gems];
  }

  public takeGems(): readonly Gem[] {
    const gems = this.gems;

    this.gems = [];

    return gems;
  }

  public get vassals(): readonly General[] {
    return this.members.filter((member) => !this.isRuler(member));
  }

  public get guardians(): readonly FifthUnit[] {
    return this.gems.map((gem) => gem.guardian);
  }

  public getReadyGuardians(date: CalendarDate): readonly FifthUnit[] {
    return this.gems
      .filter((gem) => gem.isReadyOn(date))
      .map((gem) => gem.guardian);
  }

  public findGem(guardian: FifthUnit): Gem | undefined {
    return this.gems.find((gem) => gem.guardian === guardian);
  }

  public isRuler(general: General | undefined): boolean {
    return isDefined(general) && this.ruler.isEqual(general);
  }

  public moveHome(province: Province): void {
    this.homeProvince = province;
    province.assignGovernor(this.ruler);
    province.cancelEntrust();
  }

  public reestablishCourt(ruler: General, home: Province, fame: number): void {
    this.breakAlliance();
    this.crown(ruler, fame);
    this.members = [ruler];
    this.homeProvince = home;
    this.gems = [];
  }

  public isEqual(other: Family): boolean {
    return this.name === other.name;
  }

  private clampFame(fame: number): number {
    return Math.max(0, Math.min(MAX_FAME, fame));
  }
}
