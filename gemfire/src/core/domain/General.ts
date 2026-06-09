import type { Stats } from './Stats';
import type { CalendarDate } from './CalendarDate';

export interface GeneralParams {
  readonly name: string;
  readonly portrait: string;
  readonly stats: Stats;
  readonly birth: CalendarDate;
  readonly loyalty: number;
}

export class General {
  public readonly name: string;
  public readonly portrait: string;
  public readonly stats: Stats;
  public readonly birth: CalendarDate;
  public loyalty: number;

  public constructor(params: GeneralParams) {
    this.name = params.name;
    this.portrait = params.portrait;
    this.stats = params.stats;
    this.birth = params.birth;
    this.loyalty = params.loyalty;
  }
}
