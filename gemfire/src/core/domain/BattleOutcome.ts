export type BattleSide = 'attacker' | 'defender';

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

export const BATTLE_SIDES: readonly BattleSide[] = ['attacker', 'defender'];

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
    return this.winner === side;
  }

  public hasLostUnit(side: BattleSide): boolean {
    return this.lostUnits.includes(side);
  }
}
