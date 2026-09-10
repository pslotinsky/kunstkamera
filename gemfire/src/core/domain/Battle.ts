import type { Army } from './Army';
import { BattleClock } from './BattleClock';
import { BattleDeployment } from './BattleDeployment';
import type { Battlefield } from './Battlefield';
import { BattleOutcome, type BattleSide } from './BattleOutcome';
import type { BattleUnit } from './BattleUnit';
import type { Cell } from './Cell';
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

  public getArmy(side: BattleSide): Army {
    return side === 'attacker' ? this.attacker : this.defender;
  }

  public getUnits(side: BattleSide): readonly BattleUnit[] {
    return this.units.filter((unit) => unit.side === side);
  }

  public getUnit(cell: Cell): BattleUnit | undefined {
    return this.units.find((unit) => unit.cell.isEqual(cell));
  }

  public getMoveRange(unit: BattleUnit): MoveRange {
    return new MoveRange(unit, this.field, this.units);
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
    const captured = this.findFlagCaptor();

    if (captured) {
      return this.decide(captured, 'flag');
    }

    if (this.attacker.isStarving) {
      return this.decide('defender', 'starvation');
    }

    if (this.defender.isStarving) {
      return this.decide('attacker', 'starvation');
    }

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

  private decide(
    winner: BattleSide,
    reason: 'flag' | 'starvation' | 'endurance',
  ): BattleOutcome {
    return new BattleOutcome({
      winner,
      reason,
      days: this.clock.daysFought,
      attackerSurvivors: this.attacker.troops,
      defenderSurvivors: this.defender.troops,
    });
  }
}
