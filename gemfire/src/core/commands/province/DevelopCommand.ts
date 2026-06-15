import type { DevelopmentGains } from '@/core/domain/Development';
import type { Province } from '@/core/domain/Province';

import { ProvinceCommand } from '../ProvinceCommand';

const MIN_GAIN = 2;
const MAX_GAIN = 5;
const INTELLIGENCE_PER_GAIN = 25;

export abstract class DevelopCommand extends ProvinceCommand {
  public static readonly COST = 10;

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

  protected abstract gains(amount: number): DevelopmentGains;

  private calculateGain({ governor }: Province): number {
    const intelligence = governor?.stats.intelligence ?? 0;

    return Math.min(
      MIN_GAIN + Math.floor(intelligence / INTELLIGENCE_PER_GAIN),
      MAX_GAIN,
    );
  }
}
