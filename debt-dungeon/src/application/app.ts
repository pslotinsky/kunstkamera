import { createBattle, drivers } from '@/config/battle';
import type { Battle } from '@/domain/battle/battle.entity';
import { BattleControl } from '@/presentation/battle/battle.control';
import { BattleController } from '@/presentation/battle/battle.controller';
import { BattleVisualizer } from '@/presentation/battle/battle.visualizer';

import { BattleRunner } from './battle/battle.runner';

export class App {
  private ui?: BattleControl;
  private controller?: BattleController;

  public init(root: Element): void {
    this.dispose();

    const runner = new BattleRunner({ battle: createBattle(), drivers });
    const ui = this.attachControl(root, runner.battle);
    const visualizer = new BattleVisualizer({ ui });

    this.ui = ui;
    this.controller = new BattleController({
      runner,
      ui,
      visualizer,
    });

    void this.controller.start();
  }

  public dispose(): void {
    this.controller?.stop();
    this.ui?.detach();
    this.controller = undefined;
    this.ui = undefined;
  }

  private attachControl(root: Element, battle: Battle): BattleControl {
    const control = new BattleControl({ battle });

    root.innerHTML = control.render().toString();
    control.attach(root);

    return control;
  }
}
