const FIRST_COLUMN_LETTER = 'A'.charCodeAt(0);
const FIRST_ROW_NUMBER = 1;

export type Terrain =
  | 'plains'
  | 'woods'
  | 'river'
  | 'boulder'
  | 'bridge'
  | 'fence'
  | 'wall';

export class Cell {
  public constructor(
    public readonly column: number,
    public readonly row: number,
    public readonly terrain: Terrain,
  ) {}

  public get name(): string {
    const letter = String.fromCharCode(FIRST_COLUMN_LETTER + this.column);

    return `${letter}${this.row + FIRST_ROW_NUMBER}`;
  }

  public isEqual(other: Cell): boolean {
    return this.column === other.column && this.row === other.row;
  }
}
