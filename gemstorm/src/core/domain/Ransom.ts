import type { General } from './General';
import type { Province } from './Province';

const PER_WAR = 2;
const FOOD_RATIO = 1.5;

export class Ransom {
  public static forGeneral(general: General): Ransom {
    const gold = general.stats.war * PER_WAR;

    return new Ransom(gold, Math.round(gold * FOOD_RATIO));
  }

  public constructor(
    public readonly gold: number,
    public readonly food: number,
  ) {}

  public spendFrom(province: Province): boolean {
    if (!this.canBePaidBy(province)) {
      return false;
    }

    const inGold = province.resources.gold >= this.gold;

    province.addResources(inGold ? { gold: -this.gold } : { food: -this.food });

    return true;
  }

  public canBePaidBy(province: Province): boolean {
    return (
      province.resources.gold >= this.gold ||
      province.resources.food >= this.food
    );
  }
}
