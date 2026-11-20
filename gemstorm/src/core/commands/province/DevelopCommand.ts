import type { Province } from '@/core/domain/Province';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const MAX_DEVELOPMENT = 100;
const INTELLIGENCE_PER_GAIN = 30;

export type DevelopTarget = 'cultivation' | 'protection';

export class DevelopCommand extends ProvinceCommand {
  public static readonly COST = 10;

  public target: DevelopTarget = 'cultivation';

  public constructor(context: WorldCommandContext) {
    super('Develop', context);
  }

  public override canExecute(): boolean {
    return this.canDevelop('cultivation') || this.canDevelop('protection');
  }

  public canDevelop(target: DevelopTarget): boolean {
    const province = this.currentProvince;

    return (
      isDefined(province) &&
      province.resources.gold >= DevelopCommand.COST &&
      province.development[target] < MAX_DEVELOPMENT
    );
  }

  public execute(): void {
    const province = this.currentProvince;

    if (isDefined(province) && this.canDevelop(this.target)) {
      province.reduceResources({ gold: DevelopCommand.COST });
      province.addDevelopment({ [this.target]: this.calculateGain(province) });
      this.complete(province, 1);
    }
  }

  private calculateGain(province: Province): number {
    const intelligence = province.effectiveStats.intelligence;
    const gain = 1 + Math.floor(intelligence / INTELLIGENCE_PER_GAIN);
    const room = MAX_DEVELOPMENT - province.development[this.target];

    return Math.min(gain, room);
  }
}
