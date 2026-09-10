import type { Battle } from './Battle';
import type { BattleSide } from './BattleOutcome';
import type { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';

export class TacticalPolicy {
  private readonly side: BattleSide;
  private readonly enemySide: BattleSide;

  public constructor(side: BattleSide) {
    this.side = side;
    this.enemySide = side === 'attacker' ? 'defender' : 'attacker';
  }

  public orderUnit(unit: BattleUnit, battle: Battle): readonly Cell[] {
    const goal = this.chooseGoal(battle);
    const range = battle.getMoveRange(unit);
    const step = this.findClosest(range.cells, goal, unit.cell);
    let walked: readonly Cell[] = [];

    if (step) {
      walked = range.findPath(step);
      unit.moveAlong(walked);
    } else {
      unit.wait();
    }

    return walked;
  }

  private chooseGoal(battle: Battle): Cell {
    const mine = battle.getArmy(this.side);
    const enemy = battle.getArmy(this.enemySide);
    const outmatched = mine.strength < enemy.strength;
    const guarded = outmatched ? this.side : this.enemySide;

    return battle.field.getFlag(guarded);
  }

  private findClosest(
    cells: readonly Cell[],
    goal: Cell,
    from: Cell,
  ): Cell | undefined {
    const nearer = cells.filter(
      (cell) =>
        this.measureDistance(cell, goal) < this.measureDistance(from, goal),
    );

    return nearer.sort(
      (left, right) =>
        this.measureDistance(left, goal) - this.measureDistance(right, goal),
    )[0];
  }

  private measureDistance(from: Cell, to: Cell): number {
    return Math.abs(from.column - to.column) + Math.abs(from.row - to.row);
  }
}
