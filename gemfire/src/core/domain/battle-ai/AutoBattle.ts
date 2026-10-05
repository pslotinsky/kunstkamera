import type { Battle } from '../Battle';
import type { BattleOutcome } from '../BattleOutcome';
import { BattleSide } from '../BattleSide';
import type { BattleUnit } from '../BattleUnit';
import type { UnitOrder } from '../UnitOrder';
import { TacticalPolicy } from './TacticalPolicy';

export const AUTO_BATTLE_DEPTH = 1;

export class AutoBattle {
  private readonly battle: Battle;
  private readonly attacker: TacticalPolicy;
  private readonly defender: TacticalPolicy;

  public constructor(battle: Battle, depth = AUTO_BATTLE_DEPTH) {
    this.battle = battle;
    this.attacker = new TacticalPolicy(BattleSide.attacker, depth);
    this.defender = new TacticalPolicy(BattleSide.defender, depth);
  }

  public fight(): BattleOutcome {
    let outcome = this.battle.findOutcome();

    while (!outcome) {
      this.playTurn();
      outcome = this.battle.findOutcome();
    }

    return outcome;
  }

  private playTurn(): void {
    const { battle } = this;
    const side = battle.turn;
    const policy = this.findPolicy(side);

    if (policy.chooseRetreat(battle)) {
      battle.retreat(side);
    } else {
      this.orderUnits(side, policy);

      if (!battle.isOver) {
        battle.endTurn();
      }
    }
  }

  private orderUnits(side: BattleSide, policy: TacticalPolicy): void {
    const { battle } = this;

    for (const unit of battle.getUnits(side)) {
      if (!battle.isOver && unit.isStanding && !unit.hasActed) {
        this.follow(unit, policy.orderUnit(unit, battle));
      }
    }
  }

  private follow(unit: BattleUnit, order: UnitOrder): void {
    const { battle } = this;
    const path = battle.getMoveRange(unit).findPath(order.destination);
    const target = order.target;
    const fence = order.fence;

    unit.moveAlong(path);

    if (target?.isStanding) {
      battle.strike(unit, target);
    } else if (fence?.terrain === 'fence') {
      battle.breakDown(unit, fence);
    } else if (fence) {
      battle.build(unit, fence);
    } else {
      unit.wait();
    }
  }

  private findPolicy(side: BattleSide): TacticalPolicy {
    return side.isAttacker ? this.attacker : this.defender;
  }
}
