import type { Army } from './Army';
import type { Battlefield } from './Battlefield';
import type { BattleSide } from './BattleOutcome';
import { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';
import { Facing } from './Facing';
import { StandardUnit } from './StandardUnit';
import type { Unit } from './Unit';

const STANDARD_SHARES = ['Knights', 'Knights', 'Archers'] as const;
const REMAINDER_UNIT = 'Horsemen';
const PARTS = STANDARD_SHARES.length + 1;

interface Body {
  readonly unit: Unit;
  readonly strength: number;
}

export class BattleDeployment {
  public constructor(private readonly field: Battlefield) {}

  public form(army: Army, side: BattleSide): readonly BattleUnit[] {
    const roster = this.splitTroops(army);
    const cells = this.findGround(side, roster.length);

    return roster.flatMap((body, index) => {
      const cell = cells[index];

      return cell ? [this.station(body, army, side, cell)] : [];
    });
  }

  private splitTroops(army: Army): readonly Body[] {
    const kinds = StandardUnit.createAll();
    const share = Math.floor(army.troops / PARTS);
    const shares = STANDARD_SHARES.map((name) => ({
      unit: this.findKind(kinds, name),
      strength: share,
    }));
    const roster: Body[] = [
      {
        unit: this.findKind(kinds, REMAINDER_UNIT),
        strength: army.troops - share * STANDARD_SHARES.length,
      },
      ...shares,
    ];

    if (army.unit) {
      roster.push({ unit: army.unit, strength: army.unit.strength });
    }

    return roster.filter((body) => body.strength > 0);
  }

  private findKind(kinds: readonly StandardUnit[], name: string): StandardUnit {
    const kind = kinds.find((each) => each.name === name);

    if (!kind) {
      throw new Error(`no standard unit named ${name}`);
    }

    return kind;
  }

  private station(
    body: Body,
    army: Army,
    side: BattleSide,
    cell: Cell,
  ): BattleUnit {
    return new BattleUnit({
      unit: body.unit,
      side,
      commander: army.commander,
      strength: body.strength,
      cell,
      facing: Facing.towardEnemy(side),
    });
  }

  private findGround(side: BattleSide, count: number): readonly Cell[] {
    const flag = this.field.getFlag(side);
    const inward = [...Array(this.field.columns).keys()];
    const columns = side === 'attacker' ? inward : inward.reverse();
    const chosen: Cell[] = [];

    for (const column of columns) {
      if (chosen.length < count) {
        const open = this.findOpenColumn(column, flag, count - chosen.length);

        chosen.push(...open);
      }
    }

    return chosen;
  }

  private findOpenColumn(
    column: number,
    flag: Cell,
    wanted: number,
  ): readonly Cell[] {
    const cells = [...Array(this.field.rows).keys()]
      .map((row) => this.field.getCell(column, row))
      .filter(
        (cell): cell is Cell =>
          cell !== undefined &&
          cell.terrain === 'plains' &&
          !cell.isEqual(flag),
      );

    cells.sort(
      (left, right) =>
        Math.abs(left.row - flag.row) - Math.abs(right.row - flag.row),
    );

    return cells.slice(0, wanted);
  }
}
