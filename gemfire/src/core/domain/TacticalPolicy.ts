import { BLOW_WEIGHT, RETALIATION } from '@/config/battle';

import { Advance } from './Advance';
import type { Battle } from './Battle';
import type { BattleSide } from './BattleOutcome';
import type { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';
import { UnitOrder } from './UnitOrder';

interface Aim {
  readonly from: Cell;
  readonly target: BattleUnit;
  readonly worth: number;
}

export class TacticalPolicy {
  private readonly side: BattleSide;
  private readonly enemySide: BattleSide;

  public constructor(side: BattleSide) {
    this.side = side;
    this.enemySide = side === 'attacker' ? 'defender' : 'attacker';
  }

  public orderUnit(unit: BattleUnit, battle: Battle): UnitOrder {
    const range = battle.getMoveRange(unit);
    const aim = this.findAim(unit, battle, [unit.cell, ...range.cells]);

    if (aim) {
      return new UnitOrder({ destination: aim.from, target: aim.target });
    }

    const goal = this.chooseGoal(battle);
    const step = this.findStep(unit, battle, range.cells, goal);

    return new UnitOrder({ destination: step ?? unit.cell });
  }

  private findAim(
    unit: BattleUnit,
    battle: Battle,
    standings: readonly Cell[],
  ): Aim | undefined {
    const aims = standings.flatMap((from) =>
      battle.getTargets(unit, from).map((target) => ({
        from,
        target,
        worth: this.measureBlow(target, from),
      })),
    );

    return aims.sort(
      (left, right) =>
        right.worth - left.worth ||
        left.target.strength - right.target.strength,
    )[0];
  }

  private measureBlow(target: BattleUnit, from: Cell): number {
    const approach = target.getApproach(from);
    const exposure = target.isNextTo(from) ? RETALIATION[approach] : 0;

    return BLOW_WEIGHT[approach] - exposure;
  }

  private chooseGoal(battle: Battle): Cell {
    const mine = battle.getStrength(this.side);
    const enemy = battle.getStrength(this.enemySide);
    const guarded = mine < enemy ? this.side : this.enemySide;

    return battle.field.getFlag(guarded);
  }

  private findStep(
    unit: BattleUnit,
    battle: Battle,
    cells: readonly Cell[],
    goal: Cell,
  ): Cell | undefined {
    const advance = new Advance(goal, unit, battle.field);
    const nearer = cells.filter((cell) => advance.isCloser(cell, unit.cell));

    return nearer.sort(
      (left, right) => advance.measure(left) - advance.measure(right),
    )[0];
  }
}
