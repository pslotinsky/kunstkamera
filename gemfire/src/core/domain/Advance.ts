import type { Battlefield } from './Battlefield';
import type { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';
import { Facing } from './Facing';

export class Advance {
  private readonly steps: Map<Cell, number>;

  public constructor(goal: Cell, walker: BattleUnit, field: Battlefield) {
    this.steps = this.walk(goal, walker, field);
  }

  public measure(cell: Cell): number {
    return this.steps.get(cell) ?? Number.POSITIVE_INFINITY;
  }

  public isCloser(cell: Cell, than: Cell): boolean {
    return this.measure(cell) < this.measure(than);
  }

  private walk(
    goal: Cell,
    walker: BattleUnit,
    field: Battlefield,
  ): Map<Cell, number> {
    const steps = new Map<Cell, number>([[goal, 0]]);
    let frontier: readonly Cell[] = [goal];
    let taken = 0;

    while (frontier.length > 0) {
      const next: Cell[] = [];

      taken += 1;

      for (const cell of frontier) {
        for (const open of this.findOpen(cell, walker, field, steps)) {
          steps.set(open, taken);
          next.push(open);
        }
      }

      frontier = next;
    }

    return steps;
  }

  private findOpen(
    cell: Cell,
    walker: BattleUnit,
    field: Battlefield,
    seen: Map<Cell, number>,
  ): readonly Cell[] {
    const neighbors = Facing.all.map((facing) =>
      field.getNeighbor(cell, facing),
    );

    return neighbors.filter(
      (open): open is Cell =>
        open !== undefined && !seen.has(open) && walker.canEnter(open),
    );
  }
}
