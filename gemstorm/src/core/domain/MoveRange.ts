import type { Battlefield } from './Battlefield';
import type { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';
import { Facing } from './Facing';

export class MoveRange {
  private readonly origin: Cell;
  private readonly cameFrom: Map<Cell, Cell | undefined>;

  public constructor(
    unit: BattleUnit,
    field: Battlefield,
    occupied: readonly BattleUnit[],
  ) {
    this.origin = unit.cell;
    this.cameFrom = this.walk(unit, field, occupied);
  }

  public get cells(): readonly Cell[] {
    return [...this.cameFrom.keys()].filter(
      (cell) => !cell.isEqual(this.origin),
    );
  }

  public includes(cell: Cell): boolean {
    return this.cells.some((open) => open.isEqual(cell));
  }

  public findPath(destination: Cell): readonly Cell[] {
    const path: Cell[] = [];
    let step: Cell | undefined = destination;

    while (step && !step.isEqual(this.origin)) {
      path.unshift(step);
      step = this.cameFrom.get(step);
    }

    return step?.isEqual(this.origin) ? path : [];
  }

  private walk(
    unit: BattleUnit,
    field: Battlefield,
    occupied: readonly BattleUnit[],
  ): Map<Cell, Cell | undefined> {
    const taken = occupied
      .filter((other) => other !== unit)
      .map((other) => other.cell);
    const cameFrom = new Map<Cell, Cell | undefined>([[unit.cell, undefined]]);
    let frontier: readonly Cell[] = [unit.cell];

    for (let step = 0; step < unit.stepsLeft; step += 1) {
      const next: Cell[] = [];

      for (const cell of frontier) {
        for (const open of this.findOpen(cell, unit, field, taken, cameFrom)) {
          cameFrom.set(open, cell);
          next.push(open);
        }
      }

      frontier = next;
    }

    return cameFrom;
  }

  private findOpen(
    cell: Cell,
    unit: BattleUnit,
    field: Battlefield,
    taken: readonly Cell[],
    seen: Map<Cell, Cell | undefined>,
  ): readonly Cell[] {
    const neighbors = Facing.all.map((facing) =>
      field.getNeighbor(cell, facing),
    );

    return neighbors.filter(
      (open): open is Cell =>
        open !== undefined &&
        !seen.has(open) &&
        !taken.includes(open) &&
        unit.canEnter(open),
    );
  }
}
