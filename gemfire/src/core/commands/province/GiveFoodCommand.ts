import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const CHARISMA_DIVISOR = 300;

export class GiveFoodCommand extends ProvinceCommand {
  public food = 0;

  public constructor(context: WorldCommandContext) {
    super('Give Food', context);
  }

  public execute(): void {
    const province = this.currentProvince;

    if (province && this.food > 0 && this.food <= province.resources.food) {
      const charisma = province.governor?.stats.charisma ?? 0;
      const loyalty = Math.floor((charisma * this.food) / CHARISMA_DIVISOR);

      province.decreaseResources({ food: this.food });
      province.increaseDevelopment({ loyalty });

      this.publish(new ProvinceUpdatedEvent(province));
      this.recordAction(1);
      this.endTurn(800);
    }
  }
}
