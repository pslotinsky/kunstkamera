import { BattleAi } from '@/domain/battle/battle.ai';
import type { Battle, BattleSide } from '@/domain/battle/battle.entity';
import { AttackCommand } from '@/domain/battle/commands/attack.command';
import { StartBattleCommand } from '@/domain/battle/commands/start-battle.command';
import type { Command } from '@/lib/domain/command';
import { CommandBus } from '@/lib/domain/command-bus';

import { AttackHandler } from './handlers/attack.handler';
import { StartBattleHandler } from './handlers/start-battle.handler';

export type ArmyDriver = 'human' | 'ai';
export type BattleDrivers = Readonly<Record<BattleSide, ArmyDriver>>;

interface Params {
  battle: Battle;
  drivers: BattleDrivers;
}

export class BattleRunner {
  public readonly battle: Battle;

  private readonly ai: readonly BattleAi[];
  private readonly commandBus = new CommandBus();

  constructor({ battle, drivers }: Params) {
    this.battle = battle;
    this.ai = (['attacker', 'defender'] as const)
      .filter((side) => drivers[side] === 'ai')
      .map((side) => new BattleAi({ battle, army: battle[side] }));

    this.commandBus.register(AttackCommand, new AttackHandler(battle));
    this.commandBus.register(
      StartBattleCommand,
      new StartBattleHandler(battle),
    );
  }

  public start(): void {
    this.execute(new StartBattleCommand());
  }

  public execute(command: Command): void {
    this.commandBus.execute(command);
    this.executeAiTurns();
  }

  private executeAiTurns(): void {
    let ai = this.getCurrentAi();

    while (ai && !this.battle.isOver) {
      const command = ai.decideCommand();
      this.commandBus.execute(command);

      ai = this.getCurrentAi();
    }
  }

  private getCurrentAi(): BattleAi | undefined {
    return this.ai.find((player) => player.isTurn());
  }
}
