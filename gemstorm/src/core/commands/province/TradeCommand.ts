import type { Market } from '@/core/domain/Market';
import type { Province } from '@/core/domain/Province';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export type TradeDirection = 'buy' | 'sell';

export class TradeCommand extends ProvinceCommand {
  public direction: TradeDirection = 'buy';
  public amount = 0;

  public constructor(context: WorldCommandContext) {
    super('Trade', context);
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public getMinimumAmount(direction: TradeDirection): number {
    const { gold, food } = this.market.rate;

    return Math.ceil(direction === 'buy' ? gold / food : food / gold);
  }

  public getMaximumAmount(direction: TradeDirection): number {
    const province = this.currentProvince;

    return isDefined(province) ? this.measureCapacity(province, direction) : 0;
  }

  public canTrade(direction: TradeDirection, amount: number): boolean {
    return (
      Number.isInteger(amount) &&
      amount >= this.getMinimumAmount(direction) &&
      amount <= this.getMaximumAmount(direction)
    );
  }

  public execute(): void {
    const province = this.currentProvince;

    if (isDefined(province) && this.canTrade(this.direction, this.amount)) {
      this.exchange(province);
      this.complete(province);
    }
  }

  private measureCapacity(
    province: Province,
    direction: TradeDirection,
  ): number {
    const { gold, food } = province.resources;
    const foodRoom = province.getRoom('food');
    const goldRoom = province.getRoom('gold');

    return direction === 'buy'
      ? Math.min(gold, this.market.toGold(foodRoom))
      : Math.min(food, this.market.toFood(goldRoom));
  }

  private exchange(province: Province): void {
    const { amount } = this;

    if (this.direction === 'buy') {
      const food = this.market.toFood(amount);

      province.reduceResources({ gold: amount });
      province.addResources({ food });
    } else {
      const gold = this.market.toGold(amount);

      province.reduceResources({ food: amount });
      province.addResources({ gold });
    }
  }

  private get market(): Market {
    return this.context.world.market;
  }
}
