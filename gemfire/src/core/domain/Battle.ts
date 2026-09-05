import type { Army } from './Army';

export interface BattleParams {
  readonly attacker: Army;
  readonly defender: Army;
}

export class Battle {
  public readonly attacker: Army;
  public readonly defender: Army;

  public constructor(params: BattleParams) {
    this.attacker = params.attacker;
    this.defender = params.defender;
  }
}
