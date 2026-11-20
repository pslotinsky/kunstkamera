import type { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import {
  type DesertionReason,
  UnitDesertedEvent,
} from '@/core/events/UnitDesertedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

const UPKEEP_MONTHS = [3, 6, 9, 12];
const UNPAID_GOVERNOR_LOYALTY_DIVISOR = 5;

export class UpkeepCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Upkeep', context);
  }

  public execute(): void {
    const { world } = this.context;

    if (UPKEEP_MONTHS.includes(world.date.month)) {
      this.chargeOwnedProvinces();
    }
  }

  private chargeOwnedProvinces(): void {
    for (const province of this.context.world.map.provinces) {
      if (province.hasOwner()) {
        this.chargeProvince(province);
      }
    }
  }

  private chargeProvince(province: Province): void {
    this.payGovernor(province);
    this.feedTroops(province);
    this.maintainHiredUnits(province);
    this.context.events.publish(new ProvinceUpdatedEvent(province));
  }

  private payGovernor(province: Province): void {
    const cost = province.governorUpkeep;
    const { gold } = province.resources;

    if (cost > 0) {
      const payment = Math.min(gold, cost);

      province.reduceResources({ gold: payment });
    }

    if (gold < cost) {
      this.reduceLoyalty(province);
    }
  }

  private reduceLoyalty(province: Province): void {
    const { loyalty } = province.development;
    const penalty = Math.floor(loyalty / UNPAID_GOVERNOR_LOYALTY_DIVISOR);

    province.reduceDevelopment({ loyalty: penalty });
  }

  private feedTroops(province: Province): void {
    const { food } = province.resources;
    const foodNeeded = province.troopFoodUpkeep;
    const foodConsumed = Math.min(food, foodNeeded);
    const troopsLost = foodNeeded - foodConsumed;

    province.reduceResources({ food: foodConsumed, troops: troopsLost });
  }

  private maintainHiredUnits(province: Province): void {
    for (const unit of province.hiredUnits) {
      if (province.resources.gold < unit.cost) {
        this.desert(province, unit, 'unpaid');
      } else if (this.losesFaith(province, unit)) {
        this.desert(province, unit, 'faithless');
      } else {
        province.reduceResources({ gold: unit.cost });
      }
    }
  }

  private losesFaith(province: Province, unit: HiredUnit): boolean {
    const fame = province.family?.fame ?? 0;

    return Math.random() < unit.getDesertionRisk(fame);
  }

  private desert(
    province: Province,
    unit: HiredUnit,
    reason: DesertionReason,
  ): void {
    province.removeUnit(unit);
    this.context.events.publish(new UnitDesertedEvent(province, unit, reason));
  }
}
