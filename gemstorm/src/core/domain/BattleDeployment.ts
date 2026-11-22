import { isDefined } from '@/lib/value/isDefined';

import type { Army } from './Army';
import type { Battlefield } from './Battlefield';
import { BattleSide } from './BattleSide';
import { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';
import { Facing } from './Facing';
import { StandardUnit } from './StandardUnit';
import type { Unit } from './Unit';

const STANDARD_SHARES = ['Knights', 'Knights', 'Archers'] as const;
const REMAINDER_UNIT = 'Horsemen';
const PARTS = STANDARD_SHARES.length + 1;
const FIRST_STARTING_ROW = 2;

interface Placement {
  readonly body: Body;
  readonly army: Army;
  readonly side: BattleSide;
  readonly slot: number;
  readonly cell: Cell;
}

interface Body {
  readonly unit: Unit;
  readonly strength: number;
}

export class BattleDeployment {
  public constructor(private readonly field: Battlefield) {}

  public form(army: Army, side: BattleSide): readonly BattleUnit[] {
    const roster = this.splitTroops(army);

    return roster.flatMap((body, slot) => {
      const cell = this.findStartingCell(side, slot);
      const isPresent = body.strength > 0 && isDefined(cell);

      return isPresent ? [this.station({ body, army, side, slot, cell })] : [];
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

    return roster;
  }

  private findKind(kinds: readonly StandardUnit[], name: string): StandardUnit {
    const kind = kinds.find((each) => each.name === name);

    if (!kind) {
      throw new Error(`no standard unit named ${name}`);
    }

    return kind;
  }

  private station(placement: Placement): BattleUnit {
    const { body, army, side, slot, cell } = placement;
    const commanderWar = army.commanderWar;

    return new BattleUnit({
      unit: body.unit,
      side,
      slot,
      commanderWar,
      strength: body.strength,
      cell,
      facing: Facing.towardEnemy(side),
    });
  }

  private findStartingCell(side: BattleSide, slot: number): Cell | undefined {
    const column = side.isAttacker ? 0 : this.field.columns - 1;

    return this.field.getCell(column, FIRST_STARTING_ROW + slot);
  }
}
