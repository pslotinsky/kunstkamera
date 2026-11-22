import { isDefined } from '@/lib/value/isDefined';

import type { Army } from './Army';
import { AttackRange } from './AttackRange';
import { BattleClock } from './BattleClock';
import type { MeleeRollMode } from './BattleDamage';
import { BattleDeployment } from './BattleDeployment';
import type { Battlefield } from './Battlefield';
import { type BattleOutcome } from './BattleOutcome';
import { BattleSide } from './BattleSide';
import type { BattleUnit } from './BattleUnit';
import { BattleVerdict } from './BattleVerdict';
import type { Cell } from './Cell';
import type { Clash } from './Clash';
import { Facing } from './Facing';
import { MoveRange } from './MoveRange';

const ROUND_OPENING_SIDE = BattleSide.defender;

export interface BattleParams {
  readonly attacker: Army;
  readonly defender: Army;
  readonly field: Battlefield;
  readonly units?: readonly BattleUnit[] | undefined;
}

interface BattleState {
  readonly clock: BattleClock;
  readonly turn: BattleSide;
  readonly abandonedBy: BattleSide | undefined;
  readonly starvedSide: BattleSide | undefined;
}

export class Battle {
  public readonly attacker: Army;
  public readonly defender: Army;
  public readonly field: Battlefield;
  public readonly units: readonly BattleUnit[];

  public clock: BattleClock;
  public turn: BattleSide;

  private abandonedBy: BattleSide | undefined;
  private starvedSide: BattleSide | undefined;

  public constructor(params: BattleParams, state?: BattleState) {
    this.attacker = params.attacker;
    this.defender = params.defender;
    this.field = params.field;
    this.units = params.units ?? this.deploy(params.field);
    this.clock = state?.clock ?? new BattleClock();
    this.turn = state?.turn ?? ROUND_OPENING_SIDE;
    this.abandonedBy = state?.abandonedBy;
    this.starvedSide = state?.starvedSide;

    if (!isDefined(state)) {
      this.feedArmies();
    }
  }

  public clone(): Battle {
    const field = this.field.clone();
    const units = this.units.map((unit) =>
      unit.clone(field.getCell(unit.cell.column, unit.cell.row) ?? unit.cell),
    );
    const params = {
      attacker: this.attacker.clone(),
      defender: this.defender.clone(),
      field,
      units,
    };
    const { clock, turn, abandonedBy, starvedSide } = this;

    return new Battle(params, { clock, turn, abandonedBy, starvedSide });
  }

  public get isOver(): boolean {
    return this.findOutcome() !== undefined;
  }

  public get standing(): readonly BattleUnit[] {
    return this.units.filter((unit) => unit.isStanding);
  }

  public getArmy(side: BattleSide): Army {
    return side.isAttacker ? this.attacker : this.defender;
  }

  public getUnits(side: BattleSide): readonly BattleUnit[] {
    return this.standing.filter((unit) => unit.side.isEqual(side));
  }

  public getUnit(cell: Cell): BattleUnit | undefined {
    return this.standing.find((unit) => unit.cell.isEqual(cell));
  }

  public getStrength(side: BattleSide): number {
    return this.getUnits(side).reduce(
      (total, unit) => total + unit.strength,
      0,
    );
  }

  public getMoveRange(unit: BattleUnit): MoveRange {
    return new MoveRange(unit, this.field, this.standing);
  }

  public getAttackRange(unit: BattleUnit, from: Cell = unit.cell): AttackRange {
    return new AttackRange(unit, this.field, from);
  }

  public getTargets(
    unit: BattleUnit,
    from: Cell = unit.cell,
  ): readonly BattleUnit[] {
    const range = this.getAttackRange(unit, from);

    return this.standing.filter(
      (other) => !other.side.isEqual(unit.side) && range.includes(other.cell),
    );
  }

  public strike(
    unit: BattleUnit,
    target: BattleUnit,
    meleeRoll: MeleeRollMode = 'random',
  ): Clash {
    unit.turnTo(target.cell);

    const clash = unit.strikeAt(target, meleeRoll);

    unit.finishTurn();
    this.chargeCasualties(clash.target, clash.losses);
    this.chargeCasualties(clash.striker, clash.strikerLosses);

    return clash;
  }

  public getBuildSites(
    unit: BattleUnit,
    from: Cell = unit.cell,
  ): readonly Cell[] {
    let sites: readonly Cell[] = [];

    if (unit.canBuild) {
      sites = this.findBeside(from).filter(
        (cell) =>
          cell.terrain === 'plains' &&
          !this.isFlag(cell) &&
          !isDefined(this.getUnit(cell)),
      );
    }

    return sites;
  }

  public getBreakable(
    unit: BattleUnit,
    from: Cell = unit.cell,
  ): readonly Cell[] {
    return this.findBeside(from).filter((cell) => cell.terrain === 'fence');
  }

  public build(unit: BattleUnit, cell: Cell): boolean {
    return this.work(unit, cell, this.getBuildSites(unit), (site) =>
      site.raiseFence(),
    );
  }

  public breakDown(unit: BattleUnit, cell: Cell): boolean {
    return this.work(unit, cell, this.getBreakable(unit), (site) =>
      site.breakFence(),
    );
  }

  public retreat(side: BattleSide): void {
    this.abandonedBy = side;
  }

  public endTurn(): void {
    this.turn = this.turn.opposite;

    if (this.turn.isEqual(ROUND_OPENING_SIDE)) {
      this.turnClock();
    }

    for (const unit of this.getUnits(this.turn)) {
      unit.refresh();
    }
  }

  public findOutcome(): BattleOutcome | undefined {
    return new BattleVerdict(this, this.abandonedBy, this.starvedSide).find();
  }

  private deploy(field: Battlefield): readonly BattleUnit[] {
    const deployment = new BattleDeployment(field);

    return [
      ...deployment.form(this.attacker, BattleSide.attacker),
      ...deployment.form(this.defender, BattleSide.defender),
    ];
  }

  private findBeside(from: Cell): readonly Cell[] {
    const neighbors = Facing.all.map((facing) =>
      this.field.getNeighbor(from, facing),
    );

    return neighbors.filter((cell): cell is Cell => cell !== undefined);
  }

  private isFlag(cell: Cell): boolean {
    return (
      cell.isEqual(this.field.attackerFlag) ||
      cell.isEqual(this.field.defenderFlag)
    );
  }

  private work(
    unit: BattleUnit,
    cell: Cell,
    allowed: readonly Cell[],
    change: (site: Cell) => void,
  ): boolean {
    const site = allowed.find((open) => open.isEqual(cell));
    let succeeded = false;

    if (isDefined(site) && this.canWork(unit)) {
      succeeded = Math.random() < unit.fenceOdds;

      if (succeeded) {
        change(site);
      }

      unit.finishTurn();
    }

    return succeeded;
  }

  private canWork(unit: BattleUnit): boolean {
    return (
      unit.isStanding &&
      !unit.hasActed &&
      unit.side.isEqual(this.turn) &&
      this.units.includes(unit)
    );
  }

  private chargeCasualties(unit: BattleUnit, losses: number): void {
    if (unit.isTroops && losses > 0) {
      this.getArmy(unit.side).takeCasualties(losses);
    }
  }

  private turnClock(): void {
    if (this.clock.isDayEnd) {
      this.finishDay();
    } else {
      this.clock = this.clock.next();
    }
  }

  private finishDay(): void {
    this.starvedSide = BattleSide.all.find(
      (side) => this.getArmy(side).isStarving,
    );

    if (!isDefined(this.starvedSide)) {
      this.clock = this.clock.next();

      if (!this.clock.isSpent) {
        this.feedArmies();
      }
    }
  }

  private feedArmies(): void {
    for (const side of BattleSide.all) {
      const fifthUnit = this.getUnits(side).find((unit) => unit.isFifthUnit);
      const fifthUnitStrength = fifthUnit?.strength ?? 0;

      this.getArmy(side).eat(fifthUnitStrength);
    }
  }
}
