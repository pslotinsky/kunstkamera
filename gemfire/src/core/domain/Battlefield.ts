import {
  BATTLE_TILES,
  BATTLEFIELDS,
  type BattlefieldParams,
} from '@/config/battlefields';

import type { BattleSide } from './BattleOutcome';
import { Cell } from './Cell';
import type { Facing } from './Facing';

export class Battlefield {
  public static ofProvince(province: number): Battlefield {
    const layout = BATTLEFIELDS.find((field) => field.province === province);

    if (!layout) {
      throw new Error(`no battlefield layout for province ${province}`);
    }

    return new Battlefield(layout);
  }

  public readonly name: string;
  public readonly columns: number;
  public readonly rows: number;

  private readonly cells: readonly (readonly Cell[])[];
  private readonly flags = new Map<string, Cell>();
  private readonly sprites = new Map<Cell, string>();

  public constructor(params: BattlefieldParams) {
    this.name = params.name;
    this.rows = params.rows.length;
    this.columns = params.rows[0]?.length ?? 0;
    this.cells = params.rows.map((row, rowIndex) =>
      row.map((id, column) => this.buildCell(id, column, rowIndex)),
    );
  }

  public get attackerFlag(): Cell {
    return this.getFlag('attacker');
  }

  public get defenderFlag(): Cell {
    return this.getFlag('defender');
  }

  public getFlag(side: BattleSide): Cell {
    const cell = this.flags.get(side);

    if (!cell) {
      throw new Error(`${this.name} has no ${side} flag`);
    }

    return cell;
  }

  public get allCells(): readonly Cell[] {
    return this.cells.flat();
  }

  public getSprite(cell: Cell): string {
    return this.sprites.get(cell) ?? 'plains';
  }

  public getCell(column: number, row: number): Cell | undefined {
    return this.cells[row]?.[column];
  }

  public getNeighbor(cell: Cell, facing: Facing): Cell | undefined {
    return this.getCell(
      cell.column + facing.columnStep,
      cell.row + facing.rowStep,
    );
  }

  private buildCell(id: number, column: number, row: number): Cell {
    const tile = BATTLE_TILES[id] ?? BATTLE_TILES[0]!;
    const cell = new Cell(column, row, tile.terrain);

    this.sprites.set(cell, tile.sprite);

    if (tile.flag) {
      this.flags.set(tile.flag, cell);
    }

    return cell;
  }
}
