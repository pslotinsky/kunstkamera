import type { Cell } from './Cell';
import type { Facing } from './Facing';

export interface StanceParams {
  readonly cell: Cell;
  readonly facing: Facing;
  readonly stepsTaken: number;
}

export class Stance {
  public readonly cell: Cell;
  public readonly facing: Facing;
  public readonly stepsTaken: number;

  public constructor(params: StanceParams) {
    this.cell = params.cell;
    this.facing = params.facing;
    this.stepsTaken = params.stepsTaken;
  }
}
