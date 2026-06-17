import type { Market } from '@/core/domain/Market';
import type { Province } from '@/core/domain/Province';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export type TradeDirection = 'buy' | 'sell';

export class TradeCommand extends ProvinceCommand {
  public direction: TradeDirection = 'buy';
  public food = 0;

  public constructor(context: WorldCommandContext) {
    super('Trade', context);
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {
    const province = this.currentProvince;

    if (province && this.canTrade(province)) {
      const gold = this.market.toGold(this.food);

      if (this.direction === 'buy') {
        province.addResources({ gold: -gold, food: this.food });
      } else {
        province.addResources({ gold, food: -this.food });
      }

      this.complete(province);
    }
  }

  private get market(): Market {
    return this.context.world.market;
  }

  private canTrade({ resources }: Province): boolean {
    if (this.food <= 0) {
      return false;
    }

    const cost = this.market.toGold(this.food);

    return this.direction === 'buy'
      ? resources.gold >= cost
      : resources.food >= this.food;
  }
}
