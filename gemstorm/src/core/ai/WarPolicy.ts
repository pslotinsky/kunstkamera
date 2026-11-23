import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import { AttackDeployment } from '@/core/domain/AttackDeployment';
import type { Province } from '@/core/domain/Province';
import type { ResourceGains } from '@/core/domain/Resources';
import type { World } from '@/core/domain/World';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

const EXPANSION_SHARE = 3;
const HALF = 2;

interface AttackBand {
  readonly maximumWar: number;
  readonly advantage: number;
  readonly escort: number;
}

const BOLDEST_BAND: AttackBand = {
  maximumWar: Number.POSITIVE_INFINITY,
  advantage: 1.0,
  escort: 0.9,
};

const ATTACK_BANDS: readonly AttackBand[] = [
  { maximumWar: 55, advantage: 1.6, escort: 1.4 },
  { maximumWar: 75, advantage: 1.4, escort: 1.2 },
  { maximumWar: 99, advantage: 1.2, escort: 1.0 },
  BOLDEST_BAND,
];

export class WarPolicy {
  private readonly context: WorldCommandContext;

  public constructor(context: WorldCommandContext) {
    this.context = context;
  }

  public chooseCommand(province: Province): WorldCommand | undefined {
    return this.chooseAttack(province) ?? this.chooseExpansion(province);
  }

  private chooseAttack(province: Province): WorldCommand | undefined {
    const band = this.findBand(province);
    const target = this.findTarget(province, band);

    return isDefined(target)
      ? this.prepareAttack(province, target, band)
      : undefined;
  }

  private prepareAttack(
    province: Province,
    target: Province,
    band: AttackBand,
  ): AttackCommand | undefined {
    const troops = this.countEscort(province, target, band);
    const [unit] = this.world.getFifthUnits(province);
    const days = AttackDeployment.COMPUTER_SUPPLY_DAYS;
    const food = AttackDeployment.foodForDays(troops, days, unit);
    const force = { troops, unit, food };
    const attack = new AttackCommand(this.context);
    const deployment = attack.prepare(force);
    const canLaunch =
      troops > 0 &&
      isDefined(deployment) &&
      attack.canLaunch(target, deployment);

    if (canLaunch) {
      attack.attackAt(target, force);
    }

    return canLaunch ? attack : undefined;
  }

  private findTarget(
    province: Province,
    band: AttackBand,
  ): Province | undefined {
    const hasSoldiers = province.resources.troops > 0;
    const hasUnowned = this.hasUnownedNeighbor(province);
    const isAhead = this.isAheadOfEveryEnemy(province, band);
    const canAttack = hasSoldiers && !hasUnowned && isAhead;

    return canAttack ? this.findWeakestEnemy(province) : undefined;
  }

  private hasUnownedNeighbor(province: Province): boolean {
    const neighbors = this.world.map.getNeighbors(province);

    return neighbors.some((neighbor) => neighbor.isNeutral());
  }

  private isAheadOfEveryEnemy(province: Province, band: AttackBand): boolean {
    const { troops } = province.resources;
    const enemies = this.world.getHostileNeighbors(province);

    return enemies.every((enemy) => {
      const required = enemy.resources.troops * band.advantage;

      return troops >= required;
    });
  }

  private findWeakestEnemy(province: Province): Province | undefined {
    const enemies = this.world.getHostileNeighbors(province);
    const [weakest] = [...enemies].sort(
      (left, right) => left.resources.troops - right.resources.troops,
    );

    return weakest;
  }

  private countEscort(
    province: Province,
    target: Province,
    band: AttackBand,
  ): number {
    const escort = Math.floor(target.resources.troops * band.escort);
    const half = Math.floor(province.resources.troops / HALF);

    return Math.max(escort, half);
  }

  private findBand(province: Province): AttackBand {
    const { war } = province.effectiveStats;
    const band = ATTACK_BANDS.find((candidate) => war <= candidate.maximumWar);

    return band ?? BOLDEST_BAND;
  }

  private chooseExpansion(province: Province): WorldCommand | undefined {
    const unowned = this.world.map
      .getNeighbors(province)
      .filter((neighbor) => neighbor.isNeutral());
    const move = new MoveTroopsCommand(this.context);

    if (unowned.length > 0) {
      const target = sample(unowned);
      const cargo = this.measureExpansionCargo(province);

      move.moveTo(target, cargo);
    }

    return move.isReady ? move : undefined;
  }

  private measureExpansionCargo(province: Province): ResourceGains {
    const { gold, food, troops } = province.resources;

    return {
      gold: Math.floor(gold / EXPANSION_SHARE),
      food: Math.floor(food / EXPANSION_SHARE),
      troops: Math.floor(troops / EXPANSION_SHARE),
    };
  }

  private get world(): World {
    return this.context.world;
  }
}
