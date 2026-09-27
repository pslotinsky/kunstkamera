import type { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';

export interface UnitOrderParams {
  readonly destination: Cell;
  readonly target?: BattleUnit | undefined;
  readonly fence?: Cell | undefined;
}

export class UnitOrder {
  public readonly destination: Cell;
  public readonly target: BattleUnit | undefined;
  public readonly fence: Cell | undefined;

  public constructor(params: UnitOrderParams) {
    this.destination = params.destination;
    this.target = params.target;
    this.fence = params.fence;
  }

  public get isAttacking(): boolean {
    return this.target !== undefined;
  }

  public get isWorking(): boolean {
    return this.fence !== undefined;
  }
}
