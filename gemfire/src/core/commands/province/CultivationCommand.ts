import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

const MIN_GAIN = 2;
const MAX_GAIN = 5;
const INTELLIGENCE_PER_GAIN = 25;

export class CultivationCommand extends ProvinceCommand {
  public static readonly COST = 10;

  public constructor(context: WorldCommandContext) {
    super('Cultivation', context);
  }

  public override canExecute(): boolean {
    const province = this.currentProvince;
    const gold = province?.resources.gold ?? 0;

    return gold >= CultivationCommand.COST;
  }

  public execute(): void {
    const province = this.currentProvince;

    if (province && this.canExecute()) {
      const gold = CultivationCommand.COST;
      const cultivation = this.calculateGain(province);

      province.decreaseResources({ gold });
      province.increaseDevelopment({ cultivation });

      this.publish(new ProvinceUpdatedEvent(province));
      this.recordAction(1);
      this.endTurn(800);
    }
  }

  private calculateGain({ governor }: Province): number {
    const intelligence = governor?.stats.intelligence ?? 0;

    return Math.min(
      MIN_GAIN + Math.floor(intelligence / INTELLIGENCE_PER_GAIN),
      MAX_GAIN,
    );
  }
}
