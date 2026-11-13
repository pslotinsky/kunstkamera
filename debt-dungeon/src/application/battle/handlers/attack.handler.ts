import type { Battle } from '@/domain/battle/battle.entity';
import type { AttackCommand } from '@/domain/battle/commands/attack.command';
import type { Handler } from '@/lib/domain/handler';

export class AttackHandler implements Handler<AttackCommand> {
  private readonly battle: Battle;

  constructor(battle: Battle) {
    this.battle = battle;
  }

  public execute(command: AttackCommand): void {
    this.battle.attack(command.sourceId, command.targetId);
  }
}
