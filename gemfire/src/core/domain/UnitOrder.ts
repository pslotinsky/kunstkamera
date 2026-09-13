import type { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';

export interface UnitOrderParams {
  readonly destination: Cell;
  readonly target?: BattleUnit | undefined;
}

export class UnitOrder {
  public readonly destination: Cell;
  public readonly target: BattleUnit | undefined;

  public constructor(params: UnitOrderParams) {
    this.destination = params.destination;
    this.target = params.target;
  }

  public get isAttacking(): boolean {
    return this.target !== undefined;
  }
}
