import type { Collection } from '@/lib/Collection';

import type { CalendarDate } from './CalendarDate';
import type { Family } from './Family';
import type { General } from './General';
import { Market } from './Market';
import type { Province } from './Province';
import { TurnQueue } from './TurnQueue';
import type { WorldMap } from './WorldMap';

export interface WorldParams {
  readonly date: CalendarDate;
  readonly map: WorldMap;
  readonly families: Collection<string, Family>;
  readonly generals: Collection<string, General>;
  readonly player: Family;
}

export class World {
  public date: CalendarDate;
  public readonly market = new Market();
  public readonly turnQueue: TurnQueue;
  public readonly map: WorldMap;
  public readonly families: Collection<string, Family>;
  public readonly generals: Collection<string, General>;
  public readonly player: Family;

  public constructor(params: WorldParams) {
    this.date = params.date;
    this.map = params.map;
    this.families = params.families;
    this.generals = params.generals;
    this.player = params.player;
    this.turnQueue = new TurnQueue(this.map.provinces);
  }

  public isProvinceTurn(province: Province): boolean {
    return this.turnQueue.current
      ? province.isEqual(this.turnQueue.current)
      : false;
  }
}
