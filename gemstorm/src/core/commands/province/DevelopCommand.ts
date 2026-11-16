import type { DevelopmentGains } from '@/core/domain/Development';
import type { Province } from '@/core/domain/Province';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const MIN_GAIN = 2;
const MAX_GAIN = 5;
const INTELLIGENCE_PER_GAIN = 25;

export type DevelopTarget = 'cultivation' | 'protection';

export class DevelopCommand extends ProvinceCommand {
  public static readonly COST = 10;

  public target: DevelopTarget = 'cultivation';

  public constructor(context: WorldCommandContext) {
    super('Develop', context);
  }

  public override canExecute(): boolean {
    const gold = this.currentProvince?.resources.gold ?? 0;

    return gold >= DevelopCommand.COST;
  }

  public execute(): void {
    const province = this.currentProvince;

    if (province && this.canExecute()) {
      province.addResources({ gold: -DevelopCommand.COST });
      province.addDevelopment(this.gains(this.calculateGain(province)));

      this.complete(province, 1);
    }
  }

  private gains(amount: number): DevelopmentGains {
    return this.target === 'cultivation'
      ? { cultivation: amount }
      : { protection: amount };
  }

  private calculateGain(province: Province): number {
    const intelligence = province.effectiveStats.intelligence;

    return Math.min(
      MIN_GAIN + Math.floor(intelligence / INTELLIGENCE_PER_GAIN),
      MAX_GAIN,
    );
  }
}
