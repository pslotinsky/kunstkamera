import { MONSTER_OFFER_REGIONS } from '@/config/monster-offers';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

const RESTOCK_MONTHS = [2, 8];

export class RestockHirePoolsCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Restock hire pools', context);
  }

  public execute(): void {
    const { world } = this.context;

    if (RESTOCK_MONTHS.includes(world.date.month)) {
      this.restockEmptyPools(world.map.provinces);
    }
  }

  private restockEmptyPools(provinces: readonly Province[]): void {
    for (const province of provinces) {
      if (
        province.fifthUnits.hirePool.length === 0 &&
        province.fifthUnits.hasFreeSlot
      ) {
        this.restockProvince(province);
      }
    }
  }

  private restockProvince(province: Province): void {
    const region = MONSTER_OFFER_REGIONS.find(({ provinces }) =>
      provinces.includes(province.number),
    );

    if (isDefined(region)) {
      const name = sample(region.offers);
      const unit = HiredUnit.ofName(name);

      if (isDefined(unit)) {
        province.fifthUnits.addHireOffer(unit);
        this.publish(new ProvinceUpdatedEvent(province));
      }
    }
  }
}
