export type MarketRateName = 'low' | 'average' | 'high';

export class MarketRate {
  public static readonly LOW = new MarketRate('low', 1, 2);
  public static readonly AVERAGE = new MarketRate('average', 1, 1);
  public static readonly HIGH = new MarketRate('high', 2, 1);

  private constructor(
    public readonly name: MarketRateName,
    public readonly gold: number,
    public readonly food: number,
  ) {}

  public toFood(gold: number): number {
    return Math.floor((gold * this.food) / this.gold);
  }

  public toGold(food: number): number {
    return Math.floor((food * this.gold) / this.food);
  }
}
