import type { BattleSide } from './BattleOutcome';
import type { Cell } from './Cell';
import { Facing } from './Facing';
import type { Unit } from './Unit';

export interface BattleUnitParams {
  readonly unit: Unit;
  readonly side: BattleSide;
  readonly strength: number;
  readonly cell: Cell;
  readonly facing: Facing;
}

export class BattleUnit {
  public readonly unit: Unit;
  public readonly side: BattleSide;
  public readonly strength: number;

  public cell: Cell;
  public facing: Facing;
  public hasActed = false;

  public constructor(params: BattleUnitParams) {
    this.unit = params.unit;
    this.side = params.side;
    this.strength = params.strength;
    this.cell = params.cell;
    this.facing = params.facing;
  }

  public get name(): string {
    return this.unit.name;
  }

  public get move(): number {
    return this.unit.move;
  }

  public get hasLivery(): boolean {
    return this.unit.hasLivery;
  }

  public get isMirrored(): boolean {
    return this.facing.isMirrored;
  }

  public canEnter(cell: Cell): boolean {
    return this.unit.canClear(cell.terrain);
  }

  public moveAlong(path: readonly Cell[]): void {
    const route = [this.cell, ...path];
    const departure = route.at(-2);
    const arrival = route.at(-1);

    if (departure && arrival) {
      this.facing = Facing.between(departure, arrival);
      this.cell = arrival;
    }

    this.hasActed = true;
  }

  public wait(): void {
    this.hasActed = true;
  }

  public refresh(): void {
    this.hasActed = false;
  }
}
