import {
  BACKLASH_RATE,
  BLOW_RATE,
  BLOW_WEIGHT,
  FENCE_ODDS_BASE,
  FENCE_ODDS_CEILING,
  FENCE_ODDS_FLOOR,
  FENCE_ODDS_PER_STRENGTH,
  MAX_WAR,
  RANGE_WEIGHT,
  RETALIATION,
  WAR_LEVERAGE,
} from '@/config/battle';

import { BattleSide } from './BattleSide';
import type { Cell } from './Cell';
import { Clash } from './Clash';
import { Facing } from './Facing';
import type { General } from './General';
import type { RangePattern, Unit } from './Unit';

export type Approach = 'front' | 'flank' | 'rear';

export interface BattleUnitParams {
  readonly unit: Unit;
  readonly side: BattleSide;
  readonly commander: General;
  readonly strength: number;
  readonly cell: Cell;
  readonly facing: Facing;
}

export class BattleUnit {
  public readonly unit: Unit;
  public readonly side: BattleSide;
  public readonly commander: General;
  public readonly committedStrength: number;

  public strength: number;
  public cell: Cell;
  public facing: Facing;
  public stepsTaken = 0;
  public hasActed = false;

  public constructor(params: BattleUnitParams) {
    this.unit = params.unit;
    this.side = params.side;
    this.commander = params.commander;
    this.committedStrength = params.strength;
    this.strength = params.strength;
    this.cell = params.cell;
    this.facing = params.facing;
  }

  public clone(cell: Cell): BattleUnit {
    const copy = new BattleUnit({
      unit: this.unit,
      side: this.side,
      commander: this.commander,
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
    return this.strength > 0;
  }

  public get canBuild(): boolean {
    return this.unit.buildsFences;
  }

  public get isFlying(): boolean {
    return this.unit.flying;
  }

  public get fenceOdds(): number {
    const odds = FENCE_ODDS_BASE + this.strength * FENCE_ODDS_PER_STRENGTH;

    return Math.min(Math.max(odds, FENCE_ODDS_FLOOR), FENCE_ODDS_CEILING);
  }

  public get sharpness(): number {
    return 1 + (this.commander.stats.war / MAX_WAR) * WAR_LEVERAGE;
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

  public strikeAt(target: BattleUnit): Clash {
    const approach = target.getApproach(this.cell);
    const losses = this.measureLosses(target, approach);
    const backlash = this.measureBacklash(target, approach, losses);

    target.takeLosses(losses);
    this.takeLosses(backlash);

    return new Clash({ striker: this, target, approach, losses, backlash });
  }

  public takeLosses(losses: number): void {
    this.strength = Math.max(this.strength - losses, 0);
  }

  public wait(): void {
    this.finishTurn();
  }

  public finishTurn(): void {
    this.stepsTaken = this.move;
    this.hasActed = true;
  }

  public refresh(): void {
    this.stepsTaken = 0;
    this.hasActed = false;
  }

  private measureLosses(target: BattleUnit, approach: Approach): number {
    const weight = BLOW_WEIGHT[approach] * RANGE_WEIGHT[this.range];
    const dealt =
      BLOW_RATE * weight * this.strength * this.leverageAgainst(target);

    return this.countCasualties(dealt, target.strength);
  }

  private measureBacklash(
    target: BattleUnit,
    approach: Approach,
    losses: number,
  ): number {
    const surviving = target.strength - losses;
    const answers = this.isNextTo(target.cell) && surviving > 0;
    const taken =
      BACKLASH_RATE *
      RETALIATION[approach] *
      surviving *
      target.leverageAgainst(this);

    return answers ? this.countCasualties(taken, this.strength) : 0;
  }

  private countCasualties(dealt: number, left: number): number {
    return Math.min(Math.max(Math.round(dealt), 1), left);
  }

  private leverageAgainst(other: BattleUnit): number {
    return this.sharpness / other.sharpness;
  }
}
