import type { CalendarDate } from './CalendarDate';
import type { Characteristics } from './Characteristics';

export type GeneralRank = 'ruler' | 'lord' | 'vassal';

export interface GeneralParams {
  readonly name: string;
  readonly stats: Characteristics;
  readonly birth: CalendarDate;
}

export class General {
  public readonly name: string;
  public readonly stats: Characteristics;
  public readonly birth: CalendarDate;

  public constructor(params: GeneralParams) {
    this.name = params.name;
    this.stats = params.stats;
    this.birth = params.birth;
  }

  public get portrait(): string {
    return `/portraits/${this.name.toLowerCase()}.png`;
  }

  public getAgeAt(date: CalendarDate): number {
    return date.year - this.birth.year;
  }

  public isEqual(other: General): boolean {
    return this.name === other.name;
  }
}
