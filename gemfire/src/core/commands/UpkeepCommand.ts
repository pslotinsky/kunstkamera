import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

const UPKEEP_MONTHS = [3, 6, 9, 12];

export class UpkeepCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Upkeep', context);
  }

  public execute(): void {
    const province = this.context.world.turnQueue.current;

    if (province && this.isUpkeepMonth() && province.hiredUnits.length > 0) {
      this.chargeProvince(province);
    }
  }

  private isUpkeepMonth(): boolean {
    return UPKEEP_MONTHS.includes(this.context.world.date.month);
  }

  private chargeProvince(province: Province): void {
    for (const unit of province.hiredUnits) {
      if (province.resources.gold >= unit.cost) {
        province.addResources({ gold: -unit.cost });
      } else {
        province.removeUnit(unit);
      }
    }

    this.context.events.publish(new ProvinceUpdatedEvent(province));
  }
}
