import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export class RecoverHiredUnitsCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Recover hired units', context);
  }

  public execute(): void {
    const { world } = this.context;

    for (const province of world.map.provinces) {
      if (province.hasOwner()) {
        this.recoverProvinceUnits(province);
      }
    }
  }

  private recoverProvinceUnits(province: Province): void {
    const injured = province.fifthUnits.hiredUnits.filter(
      (unit) => unit.strength < unit.maximumStrength,
    );

    for (const unit of injured) {
      unit.recover();
    }

    if (injured.length > 0) {
      this.publish(new ProvinceUpdatedEvent(province));
    }
  }
}
