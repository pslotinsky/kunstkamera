import { isDefined } from '@/lib/value/isDefined';

import type { CalendarDate } from './CalendarDate';
import type { FifthUnit } from './FifthUnit';
import type { Gem } from './Gem';
import type { General } from './General';
import type { Province } from './Province';

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
  public fame: number;
  public gems: readonly Gem[];
  public ally: Family | undefined;
  public readonly royal: boolean;

  public constructor(params: FamilyParams) {
    this.name = params.name;
    this.ruler = params.ruler;
    this.members = params.members;
    this.homeProvince = params.homeProvince;
    this.fame = params.fame ?? 0;
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

  public loseFame(amount: number): void {
    this.fame = Math.max(0, this.fame - amount);
  }

  public crown(heir: General): void {
    this.ruler = heir;
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
    victor.gems = [...victor.gems, ...this.gems];
    this.gems = [];
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
  }

  public isEqual(other: Family): boolean {
    return this.name === other.name;
  }
}
