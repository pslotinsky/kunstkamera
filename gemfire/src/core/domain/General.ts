import type { CalendarDate } from './CalendarDate';
import type { Characteristics } from './Characteristics';

export interface GeneralParams {
  readonly name: string;
  readonly stats: Characteristics;
  readonly birth?: CalendarDate | undefined;
  readonly loyalty?: number | undefined;
}

export class General {
  public readonly name: string;
  public readonly stats: Characteristics;
  public readonly birth?: CalendarDate | undefined;
  public loyalty?: number | undefined;

  public constructor(params: GeneralParams) {
    this.name = params.name;
    this.stats = params.stats;
    this.birth = params.birth;
    this.loyalty = params.loyalty;
  }

  public get portrait(): string {
    return `/portraits/${this.name.toLowerCase()}.png`;
  }
}
