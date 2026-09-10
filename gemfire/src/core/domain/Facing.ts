import type { BattleSide } from './BattleOutcome';
import type { Cell } from './Cell';

export type Aspect = 'front' | 'back' | 'side';

export class Facing {
  public static readonly north = new Facing('north', 0, -1, 'back');
  public static readonly east = new Facing('east', 1, 0, 'side');
  public static readonly south = new Facing('south', 0, 1, 'front');
  public static readonly west = new Facing('west', -1, 0, 'side');

  public static readonly all: readonly Facing[] = [
    Facing.north,
    Facing.east,
    Facing.south,
    Facing.west,
  ];

  public static towardEnemy(side: BattleSide): Facing {
    return side === 'attacker' ? Facing.east : Facing.west;
  }

  public static between(previous: Cell, next: Cell): Facing {
    const rows = next.row - previous.row;

    if (rows !== 0) {
      return rows < 0 ? Facing.north : Facing.south;
    }

    return next.column < previous.column ? Facing.west : Facing.east;
  }

  private constructor(
    public readonly name: string,
    public readonly columnStep: number,
    public readonly rowStep: number,
    public readonly aspect: Aspect,
  ) {}

  public get isMirrored(): boolean {
    return this === Facing.west;
  }

  public isEqual(other: Facing): boolean {
    return this === other;
  }

  public toString(): string {
    return this.name;
  }
}
