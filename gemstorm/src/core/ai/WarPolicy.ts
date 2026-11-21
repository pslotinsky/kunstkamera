import { AttackCommand } from '@/core/commands/province/AttackCommand';
import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import { AttackDeployment } from '@/core/domain/AttackDeployment';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

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
    const troops = countSendable(province);
    const [unit] = this.world.getFifthUnits(province);
    const days = AttackDeployment.COMPUTER_SUPPLY_DAYS;
    const force = { troops, unit, days };
    const attack = new AttackCommand(this.context);
    const deployment = attack.prepare(force);
    let command: AttackCommand | undefined;

    if (
      isDefined(target) &&
      isDefined(deployment) &&
      attack.canLaunch(target, deployment) &&
      this.hasAdvantage(deployment, target)
    ) {
      attack.attackAt(target, force);
      command = attack;
    }

    return command;
  }

  private findWeakestTarget(province: Province): Province | undefined {
    return [...this.world.getHostileNeighbors(province)].sort(
      (left, right) =>
        this.world.getDefense(left) - this.world.getDefense(right),
    )[0];
  }

  private hasAdvantage(
    deployment: AttackDeployment,
    target: Province,
  ): boolean {
    return (
      deployment.strength >= this.world.getDefense(target) * ATTACK_ADVANTAGE
    );
  }

  private get world(): World {
    return this.context.world;
  }
}
