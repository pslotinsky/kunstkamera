import { BattleSide } from './BattleSide';
export type OutcomeReason =
  | 'flag'
  | 'rout'
  | 'starvation'
  | 'endurance'
  | 'retreat';

export interface BattleOutcomeParams {
  readonly winner: BattleSide;
  readonly reason: OutcomeReason;
  readonly days: number;
  readonly attackerSurvivors: number;
  readonly defenderSurvivors: number;
  readonly lostUnits?: readonly BattleSide[];
}

export class BattleOutcome {
  public readonly winner: BattleSide;
  public readonly reason: OutcomeReason;
  public readonly days: number;
  public readonly attackerSurvivors: number;
  public readonly defenderSurvivors: number;
  public readonly lostUnits: readonly BattleSide[];

  public constructor(params: BattleOutcomeParams) {
    this.winner = params.winner;
    this.reason = params.reason;
    this.days = params.days;
    this.attackerSurvivors = params.attackerSurvivors;
    this.defenderSurvivors = params.defenderSurvivors;
    this.lostUnits = params.lostUnits ?? [];
  }

  public isWonBy(side: BattleSide): boolean {
    return this.winner.isEqual(side);
  }

  public hasLostUnit(side: BattleSide): boolean {
    return this.lostUnits.some((lost) => lost.isEqual(side));
  }
}
