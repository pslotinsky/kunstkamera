export type BattleSide = 'attacker' | 'defender';

export type OutcomeReason = 'flag' | 'rout' | 'starvation' | 'endurance';

export interface BattleOutcomeParams {
  readonly winner: BattleSide;
  readonly reason: OutcomeReason;
  readonly days: number;
  readonly attackerSurvivors: number;
  readonly defenderSurvivors: number;
}

export class BattleOutcome {
  public readonly winner: BattleSide;
  public readonly reason: OutcomeReason;
  public readonly days: number;
  public readonly attackerSurvivors: number;
  public readonly defenderSurvivors: number;

  public constructor(params: BattleOutcomeParams) {
    this.winner = params.winner;
    this.reason = params.reason;
    this.days = params.days;
    this.attackerSurvivors = params.attackerSurvivors;
    this.defenderSurvivors = params.defenderSurvivors;
  }

  public isWonBy(side: BattleSide): boolean {
    return this.winner === side;
  }
}
