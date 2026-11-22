import { ChangeLordCommand } from '@/core/commands/province/ChangeLordCommand';
import { DevelopCommand } from '@/core/commands/province/DevelopCommand';
import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import { HireMonsterCommand } from '@/core/commands/province/HireMonsterCommand';
import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import { RecruitCommand } from '@/core/commands/province/RecruitCommand';
import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { SubsidyCommand } from '@/core/commands/SubsidyCommand';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import type { Family } from '@/core/domain/Family';
import type { General } from '@/core/domain/General';
import type { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

interface Reserve {
  readonly soldiersPerUnit: number;
  readonly base: number;
}

const RESERVES: Record<'gold' | 'food', Reserve> = {
  gold: { soldiersPerUnit: 8, base: 20 },
  food: { soldiersPerUnit: 10, base: 30 },
};

const HALF = 2;
const REINFORCE_ODDS = 0.5;
const GOLD_PER_RECRUIT = 8;

type DevelopmentStat = 'cultivation' | 'loyalty' | 'protection';

const DEVELOPMENT_ORDER: readonly DevelopmentStat[] = [
  'cultivation',
  'loyalty',
  'protection',
];

export class EconomyPolicy {
  private readonly context: WorldCommandContext;

  public constructor(context: WorldCommandContext) {
    this.context = context;
  }

  public chooseTrade(province: Province): TradeCommand | undefined {
    const lacksGold = this.isShortOf(province, 'gold');
    const lacksFood = this.isShortOf(province, 'food');
    const isShortOfOne = lacksGold !== lacksFood;
    let trade: TradeCommand | undefined;

    if (isShortOfOne) {
      trade = new TradeCommand(this.context);
      trade.direction = lacksGold ? 'sell' : 'buy';
      trade.amount = this.measureTradeAmount(province, trade);
    }

    const isTradeable = trade?.canTrade(trade.direction, trade.amount);

    return isTradeable ? trade : undefined;
  }

  public chooseSubsidy(province: Province): SubsidyCommand | undefined {
    const lacksGold = this.isShortOf(province, 'gold');
    const lacksFood = this.isShortOf(province, 'food');
    const isComputerHouse = this.isComputerHouse(province);
    const donor = this.findRichestProvince(province);
    let subsidy: SubsidyCommand | undefined;

    if (lacksGold && lacksFood && isComputerHouse && isDefined(donor)) {
      subsidy = new SubsidyCommand(this.context);
      subsidy.grant(donor, province);
    }

    return subsidy;
  }

  public chooseLord(province: Province): ChangeLordCommand | undefined {
    const vassal = this.findCourtVassal(province);
    const lordless = this.findLordlessProvince(province);
    let change: ChangeLordCommand | undefined;

    if (province.isHome && isDefined(vassal) && isDefined(lordless)) {
      change = new ChangeLordCommand(this.context);
      change.assignLord(lordless, vassal);
    }

    return change;
  }

  public chooseDevelopment(province: Province): WorldCommand | undefined {
    const lowest = this.findLowestDevelopment(province);

    return lowest === 'loyalty'
      ? this.chooseGift(province)
      : this.chooseImprovement(lowest);
  }

  public chooseBuildUp(province: Province): WorldCommand | undefined {
    const reinforces = Math.random() < REINFORCE_ODDS;
    const chosen = reinforces
      ? this.chooseReinforcement(province)
      : this.chooseRecruit(province);

    return chosen ?? this.chooseHire(province);
  }

  private isShortOf(province: Province, resource: 'gold' | 'food'): boolean {
    const { troops } = province.resources;
    const { soldiersPerUnit, base } = RESERVES[resource];
    const reserve = Math.floor(troops / soldiersPerUnit) + base;

    return province.resources[resource] < reserve;
  }

  private measureTradeAmount(province: Province, trade: TradeCommand): number {
    const { gold, food } = province.resources;
    const offered = trade.direction === 'sell' ? food : gold;
    const half = Math.floor(offered / HALF);
    const maximum = trade.getMaximumAmount(trade.direction);

    return Math.min(half, maximum);
  }

  private isComputerHouse(province: Province): boolean {
    const { family } = province;

    return isDefined(family) && !family.isEqual(this.world.player);
  }

  private findRichestProvince(recipient: Province): Province | undefined {
    const others = this.getHouseProvinces(recipient).filter(
      (owned) => !owned.isEqual(recipient),
    );
    const [richest] = [...others].sort(
      (left, right) => this.measureWealth(right) - this.measureWealth(left),
    );

    return richest;
  }

  private measureWealth(province: Province): number {
    const { gold, food } = province.resources;

    return gold + food;
  }

  private findCourtVassal(province: Province): General | undefined {
    const { family } = province;
    const vassals = isDefined(family) ? this.world.getVassals(family) : [];

    return vassals[0];
  }

  private findLordlessProvince(province: Province): Province | undefined {
    const owned = this.getHouseProvinces(province);

    return owned.find((candidate) => !candidate.isHome && !candidate.hasLord);
  }

  private getHouseProvinces(province: Province): readonly Province[] {
    const { family } = province;

    return isDefined(family) ? this.world.getFamilyProvinces(family) : [];
  }

  private findLowestDevelopment(province: Province): DevelopmentStat {
    const { development } = province;

    return DEVELOPMENT_ORDER.reduce((lowest, stat) =>
      development[stat] < development[lowest] ? stat : lowest,
    );
  }

  private chooseGift(province: Province): WorldCommand | undefined {
    const gift = new GiveFoodCommand(this.context);
    const [smallest] = GiveFoodCommand.AMOUNTS;

    gift.food = smallest ?? 0;

    return province.resources.food >= gift.food ? gift : undefined;
  }

  private chooseImprovement(
    target: Exclude<DevelopmentStat, 'loyalty'>,
  ): WorldCommand | undefined {
    const develop = new DevelopCommand(this.context);

    develop.target = target;

    return develop.canDevelop(target) ? develop : undefined;
  }

  private chooseReinforcement(province: Province): WorldCommand | undefined {
    const isInterior = !this.world.isBorder(province);
    const front = this.findWeakestFront(province);
    const troops = Math.floor(province.resources.troops / HALF);
    const move = new MoveTroopsCommand(this.context);

    if (isInterior && isDefined(front)) {
      move.moveTo(front, { troops });
    }

    return move.isReady ? move : undefined;
  }

  private findWeakestFront(province: Province): Province | undefined {
    const { family } = province;
    const fronts = this.world.map
      .getNeighbors(province)
      .filter(
        (neighbor) =>
          isDefined(family) &&
          neighbor.belongsTo(family) &&
          this.world.isBorder(neighbor),
      );
    const [weakest] = [...fronts].sort(
      (left, right) => left.resources.troops - right.resources.troops,
    );

    return weakest;
  }

  private chooseRecruit(province: Province): WorldCommand | undefined {
    const recruits = this.countAffordableRecruits(province);
    let recruit: RecruitCommand | undefined;

    if (recruits > 0) {
      recruit = new RecruitCommand(this.context);
      recruit.recruit(recruits);
    }

    return recruit;
  }

  private countAffordableRecruits(province: Province): number {
    const affordable = Math.floor(province.resources.gold / GOLD_PER_RECRUIT);
    const room = province.getRoom('troops');

    return Math.min(affordable, room);
  }

  private chooseHire(province: Province): WorldCommand | undefined {
    const { family } = province;
    const isUnguarded = province.fifthUnits.hiredUnits.length === 0;
    const unit = isDefined(family)
      ? this.findAffordableUnit(province, family)
      : undefined;
    let hire: HireMonsterCommand | undefined;

    if (isUnguarded && isDefined(unit)) {
      hire = new HireMonsterCommand(this.context);
      hire.hire(unit.name);
    }

    return hire;
  }

  private findAffordableUnit(
    province: Province,
    family: Family,
  ): HiredUnit | undefined {
    const { gold } = province.resources;

    return province.fifthUnits.hireableUnits.find(
      (unit) => unit.cost <= gold && !unit.needsMoreFame(family.fame),
    );
  }

  private get world(): World {
    return this.context.world;
  }
}
