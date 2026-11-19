import type { Battle } from './Battle';
import { BattleOutcome, type OutcomeReason } from './BattleOutcome';
import { BattleSide } from './BattleSide';

interface Ending {
  readonly winner: BattleSide;
  readonly reason: OutcomeReason;
}

export class BattleVerdict {
  public constructor(
    private readonly battle: Battle,
    private readonly abandonedBy: BattleSide | undefined,
  ) {}

  public find(): BattleOutcome | undefined {
    const ending = this.findEnding();

    return ending ? this.decide(ending) : undefined;
  }

  private findEnding(): Ending | undefined {
    return (
      this.findRetreat() ??
      this.findCapture() ??
      this.findRout() ??
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
    const starved = BattleSide.all.find(
      (side) => this.battle.getArmy(side).isStarving,
    );

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
          unit.side.isEqual(side) && unit.isFifthUnit && !unit.isStanding,
      ),
    );
  }

  private decide(ending: Ending): BattleOutcome {
    return new BattleOutcome({
      winner: ending.winner,
      reason: ending.reason,
      days: this.battle.clock.daysFought,
      attackerSurvivors: this.battle.attacker.troops,
      defenderSurvivors: this.battle.defender.troops,
      lostUnits: this.findLostUnits(),
    });
  }
}
