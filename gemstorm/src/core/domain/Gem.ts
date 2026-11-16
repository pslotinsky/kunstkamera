import { GEMS } from '@/config/gems';

import type { CalendarDate } from './CalendarDate';
import { FifthUnit, type FifthUnitParams } from './FifthUnit';

export interface GemParams {
  readonly gemstone: string;
  readonly guardian: FifthUnitParams;
}

export class Gem {
  public static ofName(name: string): Gem {
    const definition = GEMS.find((gem) => gem.guardian.name === name);

    if (!definition) {
      throw new Error(`No gem named ${name}`);
    }

    return new Gem(definition);
  }

  public readonly gemstone: string;
  public readonly guardian: FifthUnit;

  public readyOn?: CalendarDate | undefined;

  public constructor(params: GemParams) {
    this.gemstone = params.gemstone;
    this.guardian = new FifthUnit(params.guardian);
  }

  public get name(): string {
    return this.guardian.name;
  }

  public rest(from: CalendarDate, months: number): void {
    this.readyOn = from.plus(months);
  }

  public isReadyOn(date: CalendarDate): boolean {
    return this.readyOn === undefined || !date.isBefore(this.readyOn);
  }

  public countMonthsLeft(date: CalendarDate): number {
    return this.readyOn ? date.countMonthsUntil(this.readyOn) : 0;
  }
}
