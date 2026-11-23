import { isDefined } from '@/lib/value/isDefined';

import type { Army } from './Army';
import type { BattleOutcome } from './BattleOutcome';
import { BattleSide } from './BattleSide';
import type { Captive } from './Captive';
import type { DefenderAnswer } from './DefensePolicy';
import type { Family } from './Family';
import type { Province } from './Province';

export interface InvasionReportParams {
  readonly source: Province;
  readonly target: Province;
  readonly defending?: Family | undefined;
  readonly attacker: Army;
  readonly defender: Army;
  readonly answer: DefenderAnswer;
  readonly outcome?: BattleOutcome | undefined;
  readonly refuge?: Province | undefined;
}

export class InvasionReport {
  public readonly source: Province;
  public readonly target: Province;
  public readonly defending: Family | undefined;
  public readonly attacker: Army;
  public readonly defender: Army;
  public readonly answer: DefenderAnswer;
  public readonly outcome: BattleOutcome | undefined;
  public readonly refuge: Province | undefined;

  public captive: Captive | undefined;
  public recoveredTroops = 0;

  public constructor(params: InvasionReportParams) {
    this.source = params.source;
    this.target = params.target;
    this.defending = params.defending;
    this.attacker = params.attacker;
    this.defender = params.defender;
    this.answer = params.answer;
    this.outcome = params.outcome;
    this.refuge = params.refuge;
  }

  public get isFought(): boolean {
    return this.outcome !== undefined;
  }

  public get isRetreat(): boolean {
    return this.answer === 'retreat' || this.outcome?.reason === 'retreat';
  }

  public get isTaken(): boolean {
    return this.outcome?.isWonBy(BattleSide.attacker) ?? true;
  }

  public get defenderRetreatDestination(): Province | undefined {
    const defenderFled = this.isRetreat || !this.defender.remotelyCommanded;
    const commanderEscaped = !isDefined(this.captive);

    return this.isTaken && defenderFled && commanderEscaped
      ? this.refuge
      : undefined;
  }

  public get attackerRetreatDestination(): Province | undefined {
    const attackerEscaped = !this.isTaken && !isDefined(this.captive);

    return attackerEscaped ? (this.refuge ?? this.source) : undefined;
  }

  public hasSide(family: Family): boolean {
    return (
      (this.source.family?.isEqual(family) ?? false) ||
      (this.defending?.isEqual(family) ?? false)
    );
  }
}
