import type { Battle } from './Battle';
import { BattleOutcome, type OutcomeReason } from './BattleOutcome';
import { BattleSide, type BattleSideName } from './BattleSide';

interface Ending {
  readonly winner: BattleSide;
  readonly reason: OutcomeReason;
}

export class BattleVerdict {
  public constructor(
    private readonly battle: Battle,
    private readonly abandonedBy: BattleSide | undefined,
    private readonly starvedSide: BattleSide | undefined,
  ) {}

  public find(): BattleOutcome | undefined {
    const ending = this.findEnding();

    return ending ? this.decide(ending) : undefined;
  }

  private findEnding(): Ending | undefined {
    return (
      this.findCapture() ??
      this.findRout() ??
      this.findRetreat() ??
      this.findStarvation() ??
      this.findEndurance()
    );
  }

  private findRetreat(): Ending | undefined {
    const abandoned = this.abandonedBy;

    return abandoned && { winner: abandoned.opposite, reason: 'retreat' };
  }

  private findCapture(): Ending | undefined {
    const field = this.battle.field;
    const onDefenderFlag = this.battle.getUnit(field.defenderFlag);
    const onAttackerFlag = this.battle.getUnit(field.attackerFlag);

    if (onDefenderFlag?.side.isAttacker) {
      return { winner: BattleSide.attacker, reason: 'flag' };
    }

    return onAttackerFlag?.side.isDefender
      ? { winner: BattleSide.defender, reason: 'flag' }
      : undefined;
  }

  private findRout(): Ending | undefined {
    const routed = BattleSide.all.find(
      (side) => this.battle.getUnits(side).length === 0,
    );

    return routed && { winner: routed.opposite, reason: 'rout' };
  }

  private findStarvation(): Ending | undefined {
    const starved = this.starvedSide;

    return starved && { winner: starved.opposite, reason: 'starvation' };
  }

  private findEndurance(): Ending | undefined {
    return this.battle.clock.isSpent
      ? { winner: BattleSide.defender, reason: 'endurance' }
      : undefined;
  }

  private findLostUnits(): readonly BattleSide[] {
    return BattleSide.all.filter((side) =>
      this.battle.units.some(
        (unit) =>
          unit.side.isEqual(side) && unit.isFifthUnit && unit.isDestroyed,
      ),
    );
  }

  private collectFifthUnitStrengths(): Partial<Record<BattleSideName, number>> {
    const strengths: Partial<Record<BattleSideName, number>> = {};

    for (const unit of this.battle.units) {
      if (unit.isFifthUnit) {
        strengths[unit.side.name] = unit.strength;
      }
    }

    return strengths;
  }

  private decide(ending: Ending): BattleOutcome {
    const fifthUnitStrengths = this.collectFifthUnitStrengths();

    return new BattleOutcome({
      winner: ending.winner,
      reason: ending.reason,
      days: this.battle.clock.daysFought,
      attackerSurvivors: this.battle.attacker.troops,
      defenderSurvivors: this.battle.defender.troops,
      lostUnits: this.findLostUnits(),
      fifthUnitStrengths,
    });
  }
}
