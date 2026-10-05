import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import { Army } from '@/core/domain/Army';
import { BATTLE_DAY_LIMIT } from '@/core/domain/BattleClock';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';

import { countSendable } from './garrison';

const ATTACK_ADVANTAGE = 1.25;

export class WarPolicy {
  private readonly context: WorldCommandContext;

  public constructor(context: WorldCommandContext) {
    this.context = context;
  }

  public chooseCommand(province: Province): WorldCommand | undefined {
    return this.chooseClaim(province) ?? this.chooseAttack(province);
  }

  private chooseClaim(province: Province): WorldCommand | undefined {
    const unclaimed = this.world.map
      .getNeighbors(province)
      .find((neighbor) => neighbor.isNeutral());
    const troops = countSendable(province);

    if (!unclaimed || troops === 0) {
      return undefined;
    }

    const move = new MoveTroopsCommand(this.context);

    move.moveTo(unclaimed, { troops });

    return move;
  }

  private chooseAttack(province: Province): WorldCommand | undefined {
    const target = this.findWeakestTarget(province);
    const army = this.raiseArmy(province);

    if (!target || !army || !this.canBreak(army, target, province)) {
      return undefined;
    }

    const attack = new AttackCommand(this.context);

    attack.attackAt(target, army);

    return attack;
  }

  private raiseArmy(province: Province): Army | undefined {
    const commander = province.governor;
    const troops = countSendable(province);
    const [unit] = this.world.getFifthUnits(province);
    const supply = Army.measureDailyFood(troops, unit) * BATTLE_DAY_LIMIT;
    const food = Math.min(province.resources.food, supply);

    return commander && troops > 0
      ? new Army({ commander, troops, food, unit })
      : undefined;
  }

  private findWeakestTarget(province: Province): Province | undefined {
    return [...this.world.getHostileNeighbors(province)].sort(
      (left, right) =>
        this.world.getDefense(left) - this.world.getDefense(right),
    )[0];
  }

  private canBreak(army: Army, target: Province, source: Province): boolean {
    return (
      army.supplyDays > 0 &&
      source.resources.gold >= army.deploymentCost &&
      army.strength >= this.world.getDefense(target) * ATTACK_ADVANTAGE
    );
  }

  private get world(): World {
    return this.context.world;
  }
}
