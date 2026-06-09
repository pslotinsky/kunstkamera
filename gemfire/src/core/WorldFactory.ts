import { PROVINCES } from '@/config/provinces';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { Province } from '@/core/domain/Province';
import { World } from '@/core/domain/World';
import { WorldMap } from '@/core/domain/WorldMap';

const startDate = new CalendarDate(1186, 4);

export class WorldFactory {
  public create(): World {
    const provinces = PROVINCES.map(
      (provinceData) => new Province(provinceData),
    );
    return new World({ date: startDate, map: new WorldMap(provinces) });
  }
}
