import type { BattleRunner } from '@/application/battle/battle.runner';
import { StartBattleCommand } from '@/domain/battle/commands/start-battle.command';
import type { Command } from '@/lib/domain/command';
import { Subscriptions } from '@/lib/subscriptions';

import type { BattleControl } from './battle.control';
import type { BattleVisualizer } from './battle.visualizer';

interface Params {
  runner: BattleRunner;
  ui: BattleControl;
  visualizer: BattleVisualizer;
}

export class BattleController {
  private readonly ui: BattleControl;
  private readonly runner: BattleRunner;
  private readonly visualizer: BattleVisualizer;
  private readonly subscriptions = new Subscriptions();

  constructor(params: Params) {
    this.runner = params.runner;
    this.ui = params.ui;
    this.visualizer = params.visualizer;

    const { battle } = this.runner;

    this.subscriptions.add(
      battle.onSquadAttacked((event) => this.visualizer.queueAttack(event)),
      battle.onSquadDied((event) => this.visualizer.queueDeath(event)),
      battle.onTurnStarted((event) => this.visualizer.queueTurnStarted(event)),
      battle.onBattleEnded(() => this.visualizer.queueBattleEnded()),
      this.ui.onAction((command) => this.handlePlayerAction(command)),
    );
  }

  public async start(): Promise<void> {
    await this.handlePlayerAction(new StartBattleCommand());
  }

  public async handlePlayerAction(command: Command): Promise<void> {
    this.ui.disableInput();

    this.runner.execute(command);

    await this.visualizer.play();

    if (this.runner.battle.isOver) {
      this.stop();
    } else {
      this.ui.enableInput();
    }
  }

  public stop(): void {
    this.subscriptions.clear();
    this.visualizer.stop();
    this.ui.disableInput();
  }
}
