import type { DevelopmentGains } from '@/core/domain/Development';
import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

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
      province.decreaseResources({ gold: DevelopCommand.COST });
      province.increaseDevelopment(this.gains(this.calculateGain(province)));

      this.publish(new ProvinceUpdatedEvent(province));
      this.recordAction(1);
      this.endTurn(800);
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
