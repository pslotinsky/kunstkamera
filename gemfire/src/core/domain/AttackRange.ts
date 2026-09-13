import { RANGE_GRIDS, RANGE_REACH } from '@/config/range-patterns';

import type { Battlefield } from './Battlefield';
import type { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';
import type { RangePattern } from './Unit';

const HIT = 'x';

export class AttackRange {
  public readonly cells: readonly Cell[];

  public constructor(
    unit: BattleUnit,
    field: Battlefield,
    from: Cell = unit.cell,
  ) {
    this.cells = this.stamp(unit.range, field, from);
  }

  public includes(cell: Cell): boolean {
    return this.cells.some((reached) => reached.isEqual(cell));
  }

  private stamp(
    range: RangePattern,
    field: Battlefield,
    from: Cell,
  ): readonly Cell[] {
    return RANGE_GRIDS[range].flatMap((row, rowIndex) =>
      [...row].flatMap((mark, columnIndex) => {
        const reached =
          mark === HIT
            ? field.getCell(
                from.column + columnIndex - RANGE_REACH,
                from.row + rowIndex - RANGE_REACH,
              )
            : undefined;

        return reached ? [reached] : [];
      }),
    );
  }
}
