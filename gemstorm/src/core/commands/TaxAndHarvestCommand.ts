import type { Province } from '@/core/domain/Province';
import type { ResourceGains } from '@/core/domain/Resources';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

const SEPTEMBER = 9;
const MAX_HARVEST_BONUS = 30;
const CULTIVATION_WEIGHT = 3;
const LOYALTY_WEIGHT = 2;
const FULL_HARVEST_GOLD_DIVISOR = 2;
const REDUCED_HARVEST_DIVISOR = 10;

export class TaxAndHarvestCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Tax & Harvest', context);
  }

  public execute(): void {
    const { world } = this.context;

    if (world.date.isMonth(SEPTEMBER)) {
      this.harvestOwnedProvinces();
    }
  }

  private harvestOwnedProvinces(): void {
    for (const province of this.context.world.map.provinces) {
      if (province.hasOwner()) {
        this.collect(province);
      }
    }
  }

  private collect(province: Province): void {
    const harvest = this.calculateHarvest(province);

    province.addResources(harvest);
    this.context.events.publish(new ProvinceUpdatedEvent(province));
  }

  private calculateHarvest(province: Province): ResourceGains {
    const { loyalty, cultivation } = province.development;
    const { charisma } = province.effectiveStats;

    return cultivation > 0 && loyalty > 0
      ? this.fullHarvest(cultivation, loyalty, charisma)
      : this.reducedHarvest(charisma);
  }

  private fullHarvest(
    cultivation: number,
    loyalty: number,
    charisma: number,
  ): ResourceGains {
    const income =
      cultivation * CULTIVATION_WEIGHT + loyalty * LOYALTY_WEIGHT + charisma;
    const gold = Math.floor(income / FULL_HARVEST_GOLD_DIVISOR);
    const food = income + this.rollHarvestBonus();

    return { gold, food };
  }

  private reducedHarvest(charisma: number): ResourceGains {
    const gold = Math.floor(charisma / REDUCED_HARVEST_DIVISOR);
    const bonus = this.rollHarvestBonus();
    const food = Math.floor((charisma + bonus) / REDUCED_HARVEST_DIVISOR);

    return { gold, food };
  }

  private rollHarvestBonus(): number {
    return Math.floor(Math.random() * (MAX_HARVEST_BONUS + 1));
  }
}
