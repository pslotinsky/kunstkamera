import type { Battle } from '../battle.entity';
import type { ArmyId } from '../battle-army.entity';
import type { SquadId } from '../battle-squad.entity';
import type { BattleTurn } from '../battle-turn.value-object';

export class TurnStartedEvent {
  public readonly armyId: ArmyId;
  public readonly squadId: SquadId;
  public readonly targetIds: readonly SquadId[];

  constructor(battle: Battle, turn: BattleTurn) {
    this.armyId = turn.belongsTo(battle.attacker)
      ? battle.attacker.id
      : battle.defender.id;

    this.squadId = turn.squad.id;
    this.targetIds = battle
      .getAttackTargets(turn.squad.id)
      .map((squad) => squad.id);
  }
}
