import type { Army } from './Army';
import type { BattleOutcome } from './BattleOutcome';
import type { DefenderAnswer } from './DefensePolicy';
import type { Province } from './Province';

export interface InvasionReportParams {
  readonly target: Province;
  readonly attacker: Army;
  readonly defender: Army;
  readonly answer: DefenderAnswer;
  readonly outcome?: BattleOutcome | undefined;
  readonly refuge?: Province | undefined;
}

export class InvasionReport {
  public readonly target: Province;
  public readonly attacker: Army;
  public readonly defender: Army;
  public readonly answer: DefenderAnswer;
  public readonly outcome: BattleOutcome | undefined;
  public readonly refuge: Province | undefined;

  public constructor(params: InvasionReportParams) {
    this.target = params.target;
    this.attacker = params.attacker;
    this.defender = params.defender;
    this.answer = params.answer;
    this.outcome = params.outcome;
    this.refuge = params.refuge;
  }

  public get isFought(): boolean {
    return this.outcome !== undefined;
  }

  public get isTaken(): boolean {
    return this.outcome?.isWonBy('attacker') ?? true;
  }
}
