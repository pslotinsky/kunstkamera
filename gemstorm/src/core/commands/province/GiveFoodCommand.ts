import { DEVELOPMENT_MAXES } from '@/core/domain/Development';
import type { Province } from '@/core/domain/Province';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const CHARISMA_DIVISOR = 300;
const REMOTE_CHARISMA_DIVISOR = 2;
const CHARISMA_TRAINING_CHANCE = 0.9;
const CHARISMA_TRAINING_GAIN = 1;

export class GiveFoodCommand extends ProvinceCommand {
  public static readonly AMOUNTS: readonly number[] = [20, 50, 80, 100];

  public food = 0;

  public constructor(context: WorldCommandContext) {
    super('Give Food', context);
  }

  public get foodStock(): number {
    return this.currentProvince?.resources.food ?? 0;
  }

  public get trainsCharisma(): boolean {
    return (
      this.currentProvince?.development.loyalty === DEVELOPMENT_MAXES.loyalty
    );
  }

  public canGive(food: number): boolean {
    return GiveFoodCommand.AMOUNTS.includes(food) && food <= this.foodStock;
  }

  public execute(): void {
    const province = this.currentProvince;

    if (isDefined(province) && this.canGive(this.food)) {
      province.reduceResources({ food: this.food });

      if (this.trainsCharisma) {
        this.trainGovernor(province);
      } else {
        this.raiseLoyalty(province);
      }

      this.complete(province, 1);
    }
  }

  private trainGovernor(province: Province): void {
    const governor = province.governor ?? province.family?.ruler;

    if (isDefined(governor) && Math.random() < CHARISMA_TRAINING_CHANCE) {
      governor.stats = governor.stats.increase({
        charisma: CHARISMA_TRAINING_GAIN,
      });
    }
  }

  private raiseLoyalty(province: Province): void {
    const charisma = this.measureCharisma(province);
    const loyalty = Math.floor((charisma * this.food) / CHARISMA_DIVISOR);

    province.addDevelopment({ loyalty });
  }

  private measureCharisma(province: Province): number {
    const rulerCharisma = province.family?.ruler.stats.charisma ?? 0;

    return isDefined(province.governor)
      ? province.effectiveStats.charisma
      : Math.floor(rulerCharisma / REMOTE_CHARISMA_DIVISOR);
  }
}
