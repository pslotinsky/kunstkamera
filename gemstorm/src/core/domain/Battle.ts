import type { Army } from './Army';
import { AttackRange } from './AttackRange';
import { BattleClock } from './BattleClock';
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

export interface BattleParams {
  readonly attacker: Army;
  readonly defender: Army;
  readonly field: Battlefield;
  readonly units?: readonly BattleUnit[] | undefined;
}

export class Battle {
  public readonly attacker: Army;
  public readonly defender: Army;
  public readonly field: Battlefield;
  public readonly units: readonly BattleUnit[];

  public clock = new BattleClock();
  public turn: BattleSide = BattleSide.attacker;

  private abandonedBy?: BattleSide | undefined;

  public constructor(params: BattleParams) {
    this.attacker = params.attacker;
    this.defender = params.defender;
    this.field = params.field;

    this.units = params.units ?? this.deploy(params.field);
  }

  public clone(): Battle {
    const field = this.field.clone();
    const copy = new Battle({
      attacker: this.attacker.clone(),
      defender: this.defender.clone(),
      field,
      units: this.units.map((unit) =>
        unit.clone(field.getCell(unit.cell.column, unit.cell.row) ?? unit.cell),
      ),
    });

    copy.clock = this.clock;
    copy.turn = this.turn;
    copy.abandonedBy = this.abandonedBy;

    return copy;
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

  public strike(unit: BattleUnit, target: BattleUnit): Clash {
    unit.turnTo(target.cell);

    const clash = unit.strikeAt(target);

    unit.finishTurn();
    this.chargeCasualties(clash.target, clash.losses);
    this.chargeCasualties(clash.striker, clash.backlash);

    return clash;
  }

  public getBuildSites(
    unit: BattleUnit,
    from: Cell = unit.cell,
  ): readonly Cell[] {
    return this.findBeside(from).filter(
      (cell) =>
        cell.terrain === 'plains' &&
        !this.isFlag(cell) &&
        this.getUnit(cell) === undefined,
    );
  }

  public getBreakable(
    unit: BattleUnit,
    from: Cell = unit.cell,
  ): readonly Cell[] {
    return this.findBeside(from).filter((cell) => cell.terrain === 'fence');
  }

  public build(unit: BattleUnit, cell: Cell): boolean {
    return this.work(unit, cell, this.getBuildSites(unit), () =>
      cell.raiseFence(),
    );
  }

  public breakDown(unit: BattleUnit, cell: Cell): boolean {
    return this.work(unit, cell, this.getBreakable(unit), () =>
      cell.breakFence(),
    );
  }

  public retreat(side: BattleSide): void {
    this.abandonedBy = side;
  }

  public endTurn(): void {
    this.turn = this.turn.opposite;

    if (this.turn.isAttacker) {
      this.turnClock();
    }

    for (const unit of this.getUnits(this.turn)) {
      unit.refresh();
    }
  }

  public findOutcome(): BattleOutcome | undefined {
    return new BattleVerdict(this, this.abandonedBy).find();
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
    change: () => void,
  ): boolean {
    if (!allowed.some((open) => open.isEqual(cell))) {
      return false;
    }

    const done = Math.random() < unit.fenceOdds;

    if (done) {
      change();
    }

    unit.finishTurn();

    return done;
  }

  private chargeCasualties(unit: BattleUnit, losses: number): void {
    if (unit.isTroops && losses > 0) {
      this.getArmy(unit.side).takeCasualties(losses);
    }
  }

  private turnClock(): void {
    const opensNewDay = this.clock.isDayEnd;

    this.clock = this.clock.next();

    if (opensNewDay) {
      this.attacker.eat();
      this.defender.eat();
    }
  }
}
