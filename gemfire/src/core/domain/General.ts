import type { Artifact } from './Artifact';
import type { CalendarDate } from './CalendarDate';
import { Characteristics } from './Characteristics';

export type GeneralRank = 'ruler' | 'lord' | 'vassal';

export interface GeneralParams {
  readonly name: string;
  readonly stats: Characteristics;
  readonly birth: CalendarDate;
}

export class General {
  public readonly name: string;
  public stats: Characteristics;
  public readonly birth: CalendarDate;

  public constructor(params: GeneralParams) {
    this.name = params.name;
    this.stats = params.stats;
    this.birth = params.birth;
  }

  public get portrait(): string {
    return `/portraits/${this.name.toLowerCase()}.png`;
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

  public isEqual(other: General): boolean {
    return this.name === other.name;
  }
}
