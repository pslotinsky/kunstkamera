import { isDefined } from '@/lib/value/isDefined';

import { BattleDamage, type MeleeRollMode } from './BattleDamage';
import { BattleSide } from './BattleSide';
import type { Cell } from './Cell';
import { Clash } from './Clash';
import { Facing } from './Facing';
import { Stance } from './Stance';
import type { RangePattern, Unit } from './Unit';

export type Approach = 'front' | 'flank' | 'rear';

const FENCE_STRENGTH_STEP = 6;
const FENCE_BASE_CHANCE = 6;
const FENCE_WAR_PER_POINT = 20;
const PERCENT = 100;

export interface BattleUnitParams {
  readonly unit: Unit;
  readonly side: BattleSide;
  readonly slot: number;
  readonly commanderWar: number;
  readonly strength: number;
  readonly cell: Cell;
  readonly facing: Facing;
}

export class BattleUnit {
  public readonly unit: Unit;
  public readonly side: BattleSide;
  public readonly slot: number;
  public readonly commanderWar: number;
  public readonly committedStrength: number;

  public strength: number;
  public cell: Cell;
  public facing: Facing;
  public stepsTaken = 0;
  public hasActed = false;

  private stanceBeforeMove?: Stance | undefined;

  public constructor(params: BattleUnitParams) {
    this.unit = params.unit;
    this.side = params.side;
    this.slot = params.slot;
    this.commanderWar = params.commanderWar;
    this.committedStrength = params.strength;
    this.strength = params.strength;
    this.cell = params.cell;
    this.facing = params.facing;
  }

  public clone(cell: Cell): BattleUnit {
    const copy = new BattleUnit({
      unit: this.unit,
      side: this.side,
      slot: this.slot,
      commanderWar: this.commanderWar,
      strength: this.committedStrength,
      cell,
      facing: this.facing,
    });

    copy.strength = this.strength;
    copy.stepsTaken = this.stepsTaken;
    copy.hasActed = this.hasActed;

    return copy;
  }

  public get name(): string {
    return this.unit.name;
  }

  public get move(): number {
    return this.unit.move;
  }

  public get stepsLeft(): number {
    return Math.max(this.move - this.stepsTaken, 0);
  }

  public get hasMoved(): boolean {
    return this.stepsTaken > 0;
  }

  public get range(): RangePattern {
    return this.unit.range;
  }

  public get hasLivery(): boolean {
    return this.unit.hasLivery;
  }

  public get isTroops(): boolean {
    return this.unit.isTroops;
  }

  public get isFifthUnit(): boolean {
    return !this.unit.isTroops;
  }

  public get standsAlone(): boolean {
    return this.unit.standsAlone;
  }

  public get isMirrored(): boolean {
    return this.facing.isMirrored;
  }

  public get isStanding(): boolean {
    return this.strength >= this.unit.minimumActiveStrength;
  }

  public get isDestroyed(): boolean {
    return this.strength === 0;
  }

  public get canBuild(): boolean {
    return this.unit.buildsFences;
  }

  public get isFlying(): boolean {
    return this.unit.flying;
  }

  public get fenceOdds(): number {
    const strengthSteps = Math.floor(this.strength / FENCE_STRENGTH_STEP);
    const strengthBonus = strengthSteps * FENCE_STRENGTH_STEP;
    const warBonus = Math.floor(this.commanderWar / FENCE_WAR_PER_POINT);
    const chance = FENCE_BASE_CHANCE + strengthBonus + warBonus;

    return Math.min(chance, PERCENT) / PERCENT;
  }

  public canEnter(cell: Cell): boolean {
    return this.unit.canClear(cell.terrain);
  }

  public isNextTo(cell: Cell): boolean {
    const columns = Math.abs(cell.column - this.cell.column);
    const rows = Math.abs(cell.row - this.cell.row);

    return columns + rows === 1;
  }

  public getApproach(from: Cell): Approach {
    const columns = Math.abs(from.column - this.cell.column);
    const rows = Math.abs(from.row - this.cell.row);

    if (columns === rows) {
      return 'flank';
    }

    const direction = Facing.toward(this.cell, from);

    if (direction.isEqual(this.facing)) {
      return 'front';
    }

    return direction.isEqual(this.facing.opposite) ? 'rear' : 'flank';
  }

  public moveAlong(path: readonly Cell[]): void {
    this.stanceBeforeMove ??= new Stance({
      cell: this.cell,
      facing: this.facing,
      stepsTaken: this.stepsTaken,
    });

    const route = [this.cell, ...path];
    const departure = route.at(-2);
    const arrival = route.at(-1);

    if (departure && arrival) {
      this.facing = Facing.between(departure, arrival);
      this.cell = arrival;
    }

    this.stepsTaken += path.length;
  }

  public turnTo(cell: Cell): void {
    this.facing = Facing.toward(this.cell, cell);
  }

  public strikeAt(
    target: BattleUnit,
    meleeRoll: MeleeRollMode = 'random',
  ): Clash {
    const approach = target.getApproach(this.cell);
    const damage = new BattleDamage({
      striker: this,
      target,
      approach,
      meleeRoll,
    }).measure();
    const losses = target.takeLosses(damage.targetLosses);
    const backlash = this.takeLosses(damage.strikerLosses);
    const fatigue = this.takeLosses(damage.fatigue);

    return new Clash({
      striker: this,
      target,
      approach,
      losses,
      backlash,
      fatigue,
    });
  }

  public takeLosses(losses: number): number {
    const previous = this.strength;
    const minimum = this.unit.isSpecial && previous > 0 ? 1 : 0;

    this.strength = Math.max(previous - losses, minimum);

    return previous - this.strength;
  }

  public wait(): void {
    this.finishTurn();
  }

  public isEqual(other: BattleUnit): boolean {
    return this.side.isEqual(other.side) && this.slot === other.slot;
  }

  public get canTakeBackMove(): boolean {
    return isDefined(this.stanceBeforeMove);
  }

  public takeBackMove(): void {
    const stance = this.stanceBeforeMove;

    if (stance) {
      this.cell = stance.cell;
      this.facing = stance.facing;
      this.stepsTaken = stance.stepsTaken;
      this.stanceBeforeMove = undefined;
    }
  }

  public commitMove(): void {
    this.stanceBeforeMove = undefined;
  }

  public finishTurn(): void {
    this.commitMove();
    this.stepsTaken = this.move;
    this.hasActed = true;
  }

  public refresh(): void {
    this.commitMove();
    this.stepsTaken = 0;
    this.hasActed = false;
  }
}
