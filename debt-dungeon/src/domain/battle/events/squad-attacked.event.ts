import type { BattleSquad, SquadId } from '../battle-squad.entity';
import type { SquadHealth } from '../squad-health.value-object';

export class SquadAttackedEvent {
  public readonly sourceId: SquadId;
  public readonly targetId: SquadId;
  public readonly damage: number;
  public readonly after: SquadHealth;

  constructor(source: BattleSquad, target: BattleSquad, damage: number) {
    this.sourceId = source.id;
    this.targetId = target.id;
    this.damage = damage;
    this.after = target.health;
  }
}
