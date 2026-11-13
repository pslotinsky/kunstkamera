import type { BattleArmy } from './battle-army.entity';
import type { BattleSquad } from './battle-squad.entity';

interface Params {
  army: BattleArmy;
  squad: BattleSquad;
}

export class BattleTurn {
  public static create(params: Params): BattleTurn {
    return new BattleTurn(params);
  }

  public readonly squad: BattleSquad;

  private readonly army: BattleArmy;

  private constructor(params: Params) {
    this.army = params.army;
    this.squad = params.squad;
  }

  public belongsTo(army: BattleArmy): boolean {
    return this.army.isEqual(army);
  }
}
