import type { Artifact } from './Artifact';
import type { CalendarDate } from './CalendarDate';
import { Characteristics } from './Characteristics';
import type { Family } from './Family';

export type GeneralRank = 'ruler' | 'lord' | 'vassal';

export const LIFESPAN_MONTHS = 75 * 12;
const PRIME_AGE = 60;
const RULER_PACE = 2;
const VASSAL_PACE = 1;
const DEATH_ODDS = 0.9;

export interface GeneralParams {
  readonly name: string;
  readonly stats: Characteristics;
  readonly birth: CalendarDate;
  readonly lineage?: string | undefined;
  readonly deathDate?: CalendarDate | undefined;
}

export class General {
  public readonly name: string;
  public stats: Characteristics;
  public readonly birth: CalendarDate;
  public readonly lineage: string | undefined;
  public readonly deathDate: CalendarDate;

  public constructor(params: GeneralParams) {
    this.name = params.name;
    this.stats = params.stats;
    this.birth = params.birth;
    this.lineage = params.lineage;
    this.deathDate = params.deathDate ?? params.birth.plus(LIFESPAN_MONTHS);
  }

  public get portrait(): string {
    return `/portraits/${this.name.toLowerCase()}.png`;
  }

  public age(amount: number): void {
    this.stats = this.stats.increase({
      intelligence: amount,
      war: amount,
      charisma: amount,
    });
  }

  public getYearlyChange(date: CalendarDate, isRuler: boolean): number {
    const pace = isRuler ? RULER_PACE : VASSAL_PACE;

    return this.getAgeAt(date) < PRIME_AGE ? pace : -pace;
  }

  public getDeathRisk(date: CalendarDate): number {
    return date.isBefore(this.deathDate) ? 0 : DEATH_ODDS;
  }

  public decreaseWar(amount: number): void {
    this.stats = this.stats.decrease({ war: amount });
  }

  public receive(artifact: Artifact): void {
    this.stats = this.stats.increase({
      [artifact.characteristic]: artifact.bonus,
    });
  }

  public getAgeAt(date: CalendarDate): number {
    return date.year - this.birth.year;
  }

  public isKinOf(family: Family): boolean {
    return this.lineage === family.name;
  }

  public isEqual(other: General): boolean {
    return this.name === other.name;
  }
}
