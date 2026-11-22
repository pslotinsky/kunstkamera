import { sample } from '@/lib/array/sample';

import { Advice, type AdviceMeaning } from './Advice';
import type { Province } from './Province';
import type { World } from './World';

const ATTACK_ADVANTAGE = 1.5;
const SMALL_ARMY = 300;
const DEVELOPMENT_FLOOR = 75;
const MONTHS_PER_SEASON = 4;

type Topic = 'war' | 'army' | 'domestic';

interface Season {
  readonly topics: readonly Topic[];
  readonly idle: AdviceMeaning;
}

interface AdviceOption {
  readonly meaning: AdviceMeaning;
  readonly applies: boolean;
}

const SEASONS: readonly Season[] = [
  { topics: ['war', 'army', 'domestic'], idle: 'praise' },
  { topics: ['domestic', 'war', 'army'], idle: 'thought' },
  { topics: ['army', 'domestic', 'war'], idle: 'patience' },
];

export class AdviceRule {
  private readonly topics: Record<
    Topic,
    (province: Province) => Advice | undefined
  > = {
    war: (province) => this.adviseWar(province),
    army: (province) => this.adviseArmy(province),
    domestic: (province) => this.adviseDomestic(province),
  };

  public constructor(
    private readonly world: World,
    private readonly random: () => number = Math.random,
  ) {}

  public canAdvise(province: Province): boolean {
    return (
      this.world.campaign.canProgress &&
      this.world.isProvinceTurn(province) &&
      this.world.isPlayerRun(province)
    );
  }

  public advise(province: Province): Advice {
    return this.adviseShortage(province) ?? this.adviseInSeason(province);
  }

  private adviseShortage(province: Province): Advice | undefined {
    const { gold, food } = province.resources;
    const lacksGold = gold < this.measureGoldUpkeep(province);
    const lacksFood = food < province.troopFoodUpkeep;
    let meaning: AdviceMeaning | undefined;

    if (lacksGold && lacksFood) {
      meaning = 'poor-in-both';
    } else if (lacksGold) {
      meaning = 'find-gold';
    } else if (lacksFood) {
      meaning = 'starving';
    }

    return meaning ? new Advice({ meaning }) : undefined;
  }

  private adviseInSeason(province: Province): Advice {
    const index = Math.floor((this.world.date.month - 1) / MONTHS_PER_SEASON);
    const season = SEASONS[index]!;
    const advice = season.topics.reduce<Advice | undefined>(
      (found, topic) => found ?? this.topics[topic](province),
      undefined,
    );

    return advice ?? new Advice({ meaning: season.idle });
  }

  private adviseWar(province: Province): Advice | undefined {
    const neighbors = this.world.map.getNeighbors(province);
    const rivals = this.getRivalNeighbors(province);
    const unclaimed = neighbors.filter((neighbor) => !neighbor.hasOwner());
    const weakest = rivals
      .filter((rival) => this.isWeakEnoughToAttack(rival, province))
      .sort((left, right) => left.resources.troops - right.resources.troops)[0];

    if (weakest) {
      return new Advice({ meaning: 'attack', target: weakest });
    }

    if (rivals.length === 0 && unclaimed.length > 0) {
      return new Advice({
        meaning: 'no-ruler',
        target: sample(unclaimed, this.random),
      });
    }

    return undefined;
  }

  private adviseArmy(province: Province): Advice | undefined {
    const { troops } = province.resources;
    const isOutnumbered =
      troops < SMALL_ARMY &&
      this.getRivalNeighbors(province).some(
        (rival) => rival.resources.troops > troops,
      );
    const isUnguarded = province.fifthUnits.hiredUnits.length === 0;

    return this.pick([
      { meaning: 'enlarge-army', applies: isOutnumbered },
      { meaning: 'hire-monsters', applies: isUnguarded },
      { meaning: 'hire-mercenaries', applies: isUnguarded },
    ]);
  }

  private adviseDomestic(province: Province): Advice | undefined {
    const { loyalty, cultivation, protection } = province.development;

    return this.pick([
      { meaning: 'be-generous', applies: loyalty < DEVELOPMENT_FLOOR },
      { meaning: 'cultivate', applies: cultivation < DEVELOPMENT_FLOOR },
      {
        meaning: 'prepare-for-disasters',
        applies: protection < DEVELOPMENT_FLOOR,
      },
    ]);
  }

  private pick(options: readonly AdviceOption[]): Advice | undefined {
    const meanings = options
      .filter((option) => option.applies)
      .map((option) => option.meaning);

    return meanings.length > 0
      ? new Advice({ meaning: sample(meanings, this.random) })
      : undefined;
  }

  private getRivalNeighbors(province: Province): readonly Province[] {
    return this.world.getHostileNeighbors(province);
  }

  private isWeakEnoughToAttack(rival: Province, province: Province): boolean {
    return (
      Math.floor(rival.resources.troops * ATTACK_ADVANTAGE) <
      province.resources.troops
    );
  }

  private measureGoldUpkeep(province: Province): number {
    const unitUpkeep = province.fifthUnits.hiredUnits.reduce(
      (total, unit) => total + unit.cost,
      0,
    );

    return province.governorUpkeep + unitUpkeep;
  }
}
