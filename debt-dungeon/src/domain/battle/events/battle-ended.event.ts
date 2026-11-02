import type { ArmyId } from '../battle-army.entity';

export class BattleEndedEvent {
  public readonly winnerArmyId?: ArmyId;

  constructor(winnerArmyId?: ArmyId) {
    this.winnerArmyId = winnerArmyId;
  }
}
