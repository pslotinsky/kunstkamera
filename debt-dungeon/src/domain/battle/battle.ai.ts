import { assertIsDefined } from '@/lib/utils/assert';
import { minBy } from '@/lib/utils/min-by';

import type { Battle } from './battle.entity';
import type { BattleArmy } from './battle-army.entity';
import type { BattleSquad } from './battle-squad.entity';
import { AttackCommand } from './commands/attack.command';

interface Params {
  battle: Battle;
  army: BattleArmy;
}

export class BattleAi {
  private readonly battle: Battle;
  private readonly army: BattleArmy;

  constructor(params: Params) {
    this.battle = params.battle;
    this.army = params.army;
  }

  public isTurn(): boolean {
    return this.battle.currentTurn.belongsTo(this.army);
  }

  public decideCommand(): AttackCommand {
    const source = this.chooseSource();
    const target = this.chooseTarget();

    return new AttackCommand({
      sourceId: source.id,
      targetId: target.id,
    });
  }

  private chooseSource(): BattleSquad {
    return this.battle.currentTurn.squad;
  }

  private chooseTarget(): BattleSquad {
    const targets = this.battle.getAttackTargets(
      this.battle.currentTurn.squad.id,
    );
    const target = minBy(targets, (squad) => squad.health.current);

    assertIsDefined(target, 'Expected an eligible attack target');

    return target;
  }
}
