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
      const charisma = province.effectiveStats.charisma;
      const loyalty = Math.floor((charisma * this.food) / CHARISMA_DIVISOR);

      province.addResources({ food: -this.food });
      province.addDevelopment({ loyalty });

      this.complete(province, 1);
    }
  }
}
