import type { Army } from './Army';
import { AttackRange } from './AttackRange';
import { BattleClock } from './BattleClock';
import { BattleDeployment } from './BattleDeployment';
import type { Battlefield } from './Battlefield';
import {
  BATTLE_SIDES,
  BattleOutcome,
  type BattleSide,
  type OutcomeReason,
} from './BattleOutcome';
import type { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';
import type { Clash } from './Clash';
import { MoveRange } from './MoveRange';

export interface BattleParams {
  readonly attacker: Army;
  readonly defender: Army;
  readonly field: Battlefield;
}

export class Battle {
  public readonly attacker: Army;
  public readonly defender: Army;
  public readonly field: Battlefield;
  public readonly units: readonly BattleUnit[];

  public clock = new BattleClock();
  public turn: BattleSide = 'attacker';

  private abandonedBy?: BattleSide | undefined;

  public constructor(params: BattleParams) {
    this.attacker = params.attacker;
    this.defender = params.defender;
    this.field = params.field;

    const deployment = new BattleDeployment(params.field);

    this.units = [
      ...deployment.form(this.attacker, 'attacker'),
      ...deployment.form(this.defender, 'defender'),
    ];
  }

  public get isOver(): boolean {
    return this.findOutcome() !== undefined;
  }

  public get standing(): readonly BattleUnit[] {
    return this.units.filter((unit) => unit.isStanding);
  }

  public getArmy(side: BattleSide): Army {
    return side === 'attacker' ? this.attacker : this.defender;
  }

  public getUnits(side: BattleSide): readonly BattleUnit[] {
    return this.standing.filter((unit) => unit.side === side);
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
      (other) => other.side !== unit.side && range.includes(other.cell),
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

  public retreat(side: BattleSide): void {
    this.abandonedBy = side;
  }

  public endTurn(): void {
    this.turn = this.turn === 'attacker' ? 'defender' : 'attacker';

    if (this.turn === 'attacker') {
      this.turnClock();
    }

    for (const unit of this.getUnits(this.turn)) {
      unit.refresh();
    }
  }

  public findOutcome(): BattleOutcome | undefined {
    const abandoned = this.abandonedBy;

    if (abandoned) {
      return this.decide(this.findEnemy(abandoned), 'retreat');
    }

    const captured = this.findFlagCaptor();

    if (captured) {
      return this.decide(captured, 'flag');
    }

    const routed = BATTLE_SIDES.find(
      (side) => this.getUnits(side).length === 0,
    );

    if (routed) {
      return this.decide(this.findEnemy(routed), 'rout');
    }

    return this.findStarved() ?? this.findEndured();
  }

  private chargeCasualties(unit: BattleUnit, losses: number): void {
    if (unit.isTroops && losses > 0) {
      this.getArmy(unit.side).takeCasualties(losses);
    }
  }

  private findEnemy(side: BattleSide): BattleSide {
    return side === 'attacker' ? 'defender' : 'attacker';
  }

  private findStarved(): BattleOutcome | undefined {
    const starved = BATTLE_SIDES.find((side) => this.getArmy(side).isStarving);

    return starved
      ? this.decide(this.findEnemy(starved), 'starvation')
      : undefined;
  }

  private findEndured(): BattleOutcome | undefined {
    return this.clock.isSpent
      ? this.decide('defender', 'endurance')
      : undefined;
  }

  private turnClock(): void {
    const opensNewDay = this.clock.isDayEnd;

    this.clock = this.clock.next();

    if (opensNewDay) {
      this.attacker.eat();
      this.defender.eat();
    }
  }

  private findFlagCaptor(): BattleSide | undefined {
    const onDefenderFlag = this.getUnit(this.field.defenderFlag);
    const onAttackerFlag = this.getUnit(this.field.attackerFlag);

    if (onDefenderFlag?.side === 'attacker') {
      return 'attacker';
    }

    return onAttackerFlag?.side === 'defender' ? 'defender' : undefined;
  }

  private findLostUnits(): readonly BattleSide[] {
    return BATTLE_SIDES.filter((side) =>
      this.units.some(
        (unit) => unit.side === side && !unit.isTroops && !unit.isStanding,
      ),
    );
  }

  private decide(winner: BattleSide, reason: OutcomeReason): BattleOutcome {
    return new BattleOutcome({
      winner,
      reason,
      days: this.clock.daysFought,
      attackerSurvivors: this.attacker.troops,
      defenderSurvivors: this.defender.troops,
      lostUnits: this.findLostUnits(),
    });
  }
}
