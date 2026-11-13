import type { BattleSquad, SquadId } from '../battle-squad.entity';

export class SquadDiedEvent {
  public readonly squadId: SquadId;

  constructor(squad: BattleSquad) {
    this.squadId = squad.id;
  }
}
