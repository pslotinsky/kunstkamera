import { isDefined } from '@/lib/value/isDefined';

import type { FifthUnit } from './FifthUnit';
import { HiredUnit } from './HiredUnit';

const FIFTH_UNIT_SLOTS = 5;
const MAX_STATIONED_FIFTH_UNITS = 3;

export class ProvinceFifthUnits {
  private available: readonly HiredUnit[];
  private stationed: readonly FifthUnit[] = [];

  public constructor(offerNames: readonly string[] = []) {
    this.available = offerNames
      .map((name) => HiredUnit.ofName(name))
      .filter(isDefined);
  }

  public get hirePool(): readonly HiredUnit[] {
    return this.available;
  }

  public get units(): readonly FifthUnit[] {
    return this.stationed;
  }

  public get hiredUnits(): readonly HiredUnit[] {
    return this.stationed.filter((unit) => unit instanceof HiredUnit);
  }

  public get hasFreeSlot(): boolean {
    return this.stationed.length + this.available.length < FIFTH_UNIT_SLOTS;
  }

  public get hasRoomForUnit(): boolean {
    return this.stationed.length < MAX_STATIONED_FIFTH_UNITS;
  }

  public get hireableUnits(): readonly HiredUnit[] {
    const unavailableNames = new Set(this.hiredUnits.map((unit) => unit.name));
    const hireable: HiredUnit[] = [];

    if (this.hasRoomForUnit) {
      for (const unit of this.available) {
        if (!unavailableNames.has(unit.name)) {
          hireable.push(unit);
          unavailableNames.add(unit.name);
        }
      }
    }

    return hireable;
  }

  public hireUnit(unit: HiredUnit): void {
    this.removeHireOffer(unit);
    this.addUnit(unit);
  }

  public dismissUnit(unit: HiredUnit): void {
    this.removeUnit(unit);
    this.addHireOffer(unit);
  }

  public addHireOffer(unit: HiredUnit): void {
    this.available = [...this.available, unit];
  }

  public removeHireOffer(unit: HiredUnit): void {
    this.available = this.available.filter((offered) => offered !== unit);
  }

  public addUnit(unit: FifthUnit): void {
    this.stationed = [...this.stationed, unit];
  }

  public removeUnit(unit: FifthUnit): void {
    this.stationed = this.stationed.filter((stationed) => stationed !== unit);
  }

  public removeSpentUnits(): void {
    this.stationed = this.stationed.filter((unit) => !unit.isSpentAfterBattle);
  }

  public hasUnit(unit: FifthUnit): boolean {
    return this.stationed.includes(unit);
  }
}
