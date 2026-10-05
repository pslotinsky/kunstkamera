import { ChangeLordCommand } from '@/core/commands/province/ChangeLordCommand';
import { DevelopCommand } from '@/core/commands/province/DevelopCommand';
import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import { HireMonsterCommand } from '@/core/commands/province/HireMonsterCommand';
import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import { RecruitCommand } from '@/core/commands/province/RecruitCommand';
import { TradeCommand } from '@/core/commands/province/TradeCommand';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import { Army } from '@/core/domain/Army';
import { BATTLE_DAY_LIMIT } from '@/core/domain/BattleClock';
import type { Family } from '@/core/domain/Family';
import type { General } from '@/core/domain/General';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { Market } from '@/core/domain/Market';
import type { Province } from '@/core/domain/Province';
import { RESOURCE_MAXES } from '@/core/domain/Resources';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

import { countSendable } from './garrison';

const GOLD_RESERVE = 30;
const LOW_LOYALTY = 40;
const FOOD_GIFT_SHARE = 0.5;
const SURPLUS_FACTOR = 2;

export class EconomyPolicy {
  private readonly context: WorldCommandContext;

  public constructor(context: WorldCommandContext) {
    this.context = context;
  }

  public chooseTrade(province: Province): TradeCommand | undefined {
    const supply = this.measureSupply(province);
    const { food, gold } = province.resources;
    const trade = new TradeCommand(this.context);

    if (food < supply) {
      trade.direction = 'buy';
      trade.food = Math.min(
        supply - food,
        this.market.toFood(Math.max(gold - GOLD_RESERVE, 0)),
      );
    } else if (gold < DevelopCommand.COST && food > supply * SURPLUS_FACTOR) {
      trade.direction = 'sell';
      trade.food = food - supply * SURPLUS_FACTOR;
    }

    return trade.food > 0 ? trade : undefined;
  }

  public chooseLords(province: Province): readonly ChangeLordCommand[] {
    const family = province.family;

    if (!family || !province.isHome) {
      return [];
    }

    const vassals = [...this.world.getVassals(family)].sort(
      (left, right) => right.stats.total - left.stats.total,
    );
    const lordless = this.world
      .getFamilyProvinces(family)
      .filter((owned) => !owned.isHome && !owned.hasLord);

    return lordless
      .map((owned, index) => this.appoint(owned, vassals[index]))
      .filter(isDefined);
  }

  public chooseCommand(province: Province): WorldCommand | undefined {
    return (
      this.chooseRecruit(province) ??
      this.chooseReinforcement(province) ??
      this.chooseHire(province) ??
      this.chooseGift(province) ??
      this.chooseDevelopment(province)
    );
  }

  private appoint(
    province: Province,
    vassal: General | undefined,
  ): ChangeLordCommand | undefined {
    if (!vassal) {
      return undefined;
    }

    const change = new ChangeLordCommand(this.context);

    change.assignLord(province, vassal);

    return change;
  }

  private chooseRecruit(province: Province): WorldCommand | undefined {
    const { troops, gold } = province.resources;
    const affordable = Math.floor(
      (gold - GOLD_RESERVE) / RecruitCommand.GOLD_PER_TROOP,
    );
    const recruits = Math.min(affordable, RESOURCE_MAXES.troops - troops);
    const isShort =
      this.world.isBorder(province) && troops < this.world.getThreat(province);

    if (!isShort || recruits <= 0) {
      return undefined;
    }

    const recruit = new RecruitCommand(this.context);

    recruit.recruit(recruits);

    return recruit;
  }

  private chooseReinforcement(province: Province): WorldCommand | undefined {
    const front = this.findStepToBorder(province);
    const sent = countSendable(province);

    if (this.world.isBorder(province) || !front || sent <= 0) {
      return undefined;
    }

    const move = new MoveTroopsCommand(this.context);

    move.moveTo(front, { troops: sent });

    return move;
  }

  private chooseHire(province: Province): WorldCommand | undefined {
    const family = province.family;
    const unit = family && this.findAffordableUnit(province, family);

    if (
      !unit ||
      !this.world.isBorder(province) ||
      province.hiredUnits.length > 0
    ) {
      return undefined;
    }

    const hire = new HireMonsterCommand(this.context);

    hire.hire(unit.name);

    return hire;
  }

  private chooseGift(province: Province): WorldCommand | undefined {
    const surplus = province.resources.food - this.measureSupply(province);

    if (province.development.loyalty >= LOW_LOYALTY || surplus <= 0) {
      return undefined;
    }

    const gift = new GiveFoodCommand(this.context);

    gift.food = Math.ceil(surplus * FOOD_GIFT_SHARE);

    return gift;
  }

  private chooseDevelopment(province: Province): WorldCommand | undefined {
    const develop = new DevelopCommand(this.context);
    const { cultivation, protection } = province.development;

    develop.target = protection < cultivation ? 'protection' : 'cultivation';

    return develop.canExecute() ? develop : undefined;
  }

  private findAffordableUnit(
    province: Province,
    family: Family,
  ): HiredUnit | undefined {
    const spendable = province.resources.gold - GOLD_RESERVE;

    return province.hirePool
      .map((name) => HiredUnit.ofName(name))
      .filter(isDefined)
      .filter(
        (unit) => unit.cost <= spendable && unit.fameToKeep <= family.fame,
      )
      .sort((left, right) => right.strength - left.strength)[0];
  }

  private findStepToBorder(province: Province): Province | undefined {
    const family = province.family;

    if (!family) {
      return undefined;
    }

    const distances = this.measureBorderDistances(family);
    const owned = this.world.map
      .getNeighbors(province)
      .filter((neighbor) => distances.has(neighbor.number));

    return owned.sort(
      (left, right) =>
        distances.get(left.number)! - distances.get(right.number)!,
    )[0];
  }

  private measureBorderDistances(family: Family): Map<number, number> {
    const owned = this.world.getFamilyProvinces(family);
    let frontier = owned.filter((province) => this.world.isBorder(province));
    const distances = new Map(
      frontier.map((province): [number, number] => [province.number, 0]),
    );
    let steps = 0;

    while (frontier.length > 0) {
      steps += 1;
      frontier = this.stepInward(frontier, family, distances);

      for (const province of frontier) {
        distances.set(province.number, steps);
      }
    }

    return distances;
  }

  private stepInward(
    frontier: readonly Province[],
    family: Family,
    distances: Map<number, number>,
  ): Province[] {
    const reached = new Map<number, Province>();

    for (const province of frontier) {
      for (const neighbor of this.world.map.getNeighbors(province)) {
        if (neighbor.belongsTo(family) && !distances.has(neighbor.number)) {
          reached.set(neighbor.number, neighbor);
        }
      }
    }

    return [...reached.values()];
  }

  private measureSupply(province: Province): number {
    return Army.measureDailyFood(province.resources.troops) * BATTLE_DAY_LIMIT;
  }

  private get market(): Market {
    return this.world.market;
  }

  private get world(): World {
    return this.context.world;
  }
}
