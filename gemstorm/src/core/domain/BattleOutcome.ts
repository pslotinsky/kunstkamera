import { BattleSide, type BattleSideName } from './BattleSide';
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
  readonly fifthUnitStrengths?: Partial<Record<BattleSideName, number>>;
}

export class BattleOutcome {
  public readonly winner: BattleSide;
  public readonly reason: OutcomeReason;
  public readonly days: number;
  public readonly attackerSurvivors: number;
  public readonly defenderSurvivors: number;
  public readonly lostUnits: readonly BattleSide[];
  private readonly fifthUnitStrengths: Partial<Record<BattleSideName, number>>;

  public constructor(params: BattleOutcomeParams) {
    this.winner = params.winner;
    this.reason = params.reason;
    this.days = params.days;
    this.attackerSurvivors = params.attackerSurvivors;
    this.defenderSurvivors = params.defenderSurvivors;
    this.lostUnits = params.lostUnits ?? [];
    this.fifthUnitStrengths = params.fifthUnitStrengths ?? {};
  }

  public isWonBy(side: BattleSide): boolean {
    return this.winner.isEqual(side);
  }

  public isWithdrawnBy(side: BattleSide): boolean {
    return this.reason === 'retreat' && !this.isWonBy(side);
  }

  public getFifthUnitStrength(side: BattleSide): number | undefined {
    return this.fifthUnitStrengths[side.name];
  }

  public hasLostUnit(side: BattleSide): boolean {
    return this.lostUnits.some((lost) => lost.isEqual(side));
  }
}
