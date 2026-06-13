import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export const SEPTEMBER = 9;

const PROVISIONAL_TAX_GOLD = 100;

export class TaxAndHarvestCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Tax & Harvest', context);
  }

  public execute(): void {
    const { world } = this.context;

    if (world.date.isMonth(SEPTEMBER)) {
      for (const province of world.map.provinces) {
        if (province.hasOwner()) {
          this.collect(province);
        }
      }
    }
  }

  private collect(province: Province): void {
    province.increaseResources({
      gold: PROVISIONAL_TAX_GOLD,
      food: this.calculateHarvest(province),
    });
    this.context.events.publish(new ProvinceUpdatedEvent(province));
  }

  private calculateHarvest(province: Province): number {
    const { loyalty, cultivation, protection } = province.development;

    return loyalty + cultivation * 2 + protection;
  }
}
