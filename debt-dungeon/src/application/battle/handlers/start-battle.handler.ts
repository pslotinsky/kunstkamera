import type { Battle } from '@/domain/battle/battle.entity';
import type { StartBattleCommand } from '@/domain/battle/commands/start-battle.command';
import type { Handler } from '@/lib/domain/handler';

export class StartBattleHandler implements Handler<StartBattleCommand> {
  private readonly battle: Battle;

  constructor(battle: Battle) {
    this.battle = battle;
  }

  public execute(): void {
    this.battle.start();
  }
}
