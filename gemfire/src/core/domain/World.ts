import type { Collection } from '@/lib/Collection';

import type { CalendarDate } from './CalendarDate';
import type { Family } from './Family';
import type { General } from './General';
import type { WorldMap } from './WorldMap';

export interface WorldParams {
  readonly date: CalendarDate;
  readonly map: WorldMap;
  readonly families: Collection<string, Family>;
  readonly generals: Collection<string, General>;
}

export class World {
  public date: CalendarDate;
  public readonly map: WorldMap;
  public readonly families: Collection<string, Family>;
  public readonly generals: Collection<string, General>;

  public constructor(params: WorldParams) {
    this.date = params.date;
    this.map = params.map;
    this.families = params.families;
    this.generals = params.generals;
  }
}
