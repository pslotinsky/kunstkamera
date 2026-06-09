import type { CalendarDate } from './CalendarDate';
import type { WorldMap } from './WorldMap';
import type { Family } from './Family';
import type { General } from './General';

export interface WorldParams {
  readonly date: CalendarDate;
  readonly map: WorldMap;
  readonly families?: readonly Family[];
  readonly generals?: readonly General[];
}

export class World {
  public date: CalendarDate;
  public readonly map: WorldMap;
  public readonly families: readonly Family[];
  public readonly generals: readonly General[];

  public constructor(params: WorldParams) {
    this.date = params.date;
    this.map = params.map;
    this.families = params.families ?? [];
    this.generals = params.generals ?? [];
  }
}
