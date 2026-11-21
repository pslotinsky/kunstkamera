import type { Artifact } from './Artifact';
import type { CalendarDate } from './CalendarDate';
import { Characteristics } from './Characteristics';
import type { Family } from './Family';

export type GeneralRank = 'ruler' | 'lord' | 'vassal';
export type RecruitClass = 0 | 1 | 2 | 3;

const DECLINE_AGE = 65;
const YEARLY_STAT_LOSS = 5;
const OLD_AGE = 75;
const PERCENT_SCALE = 100;

const YEARLY_GROWTH = {
  ruler: { chance: 0.8, gain: 2 },
  lord: { chance: 0.5, gain: 1 },
  vassal: { chance: 0.15, gain: 1 },
} satisfies Record<GeneralRank, { chance: number; gain: number }>;

export interface GeneralParams {
  readonly name: string;
  readonly stats: Characteristics;
  readonly birth: CalendarDate;
  readonly recruitClass: RecruitClass;
  readonly lineage?: string | undefined;
}

export class General {
  public readonly name: string;
  public stats: Characteristics;
  public readonly birth: CalendarDate;
  public readonly recruitClass: RecruitClass;
  private lineage: string | undefined;

  public constructor(params: GeneralParams) {
    this.name = params.name;
    this.stats = params.stats;
    this.birth = params.birth;
    this.recruitClass = params.recruitClass;
    this.lineage = params.lineage;
  }

  public ageYear(date: CalendarDate, rank: GeneralRank): void {
    const { chance, gain } = YEARLY_GROWTH[rank];

    if (this.getAgeAt(date) >= DECLINE_AGE) {
      this.changeAllStats(-YEARLY_STAT_LOSS);
    } else if (Math.random() < chance) {
      this.changeAllStats(gain);
    }
  }

  public getDeathRisk(date: CalendarDate): number {
    const age = this.getAgeAt(date);

    return age >= OLD_AGE ? Math.min(age / PERCENT_SCALE, 1) : 0;
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

  public renounceHouse(): void {
    this.lineage = undefined;
  }

  public isEqual(other: General): boolean {
    return this.name === other.name;
  }

  private changeAllStats(amount: number): void {
    this.stats = this.stats.increase({
      intelligence: amount,
      war: amount,
      charisma: amount,
    });
  }
}
