import { Battle } from '@/core/domain/Battle';
import type { DefenseChoice, Invasion } from '@/core/domain/Invasion';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export class DefendCommand extends WorldCommand {
  private invasion: Invasion | undefined;
  private choice: DefenseChoice | undefined;
  private suspended = false;

  public constructor(context: WorldCommandContext) {
    super('Defend', context);
  }

  public defend(invasion: Invasion, choice: DefenseChoice): void {
    this.invasion = invasion;
    this.choice = choice;
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public override suspendsTurn(): boolean {
    return this.suspended;
  }

  public execute(): void {
    const invasion = this.invasion;
    const choice = this.choice;

    this.suspended = false;

    if (invasion && choice) {
      const answered = invasion.answer(choice);

      this.suspended = answered instanceof Battle;
      this.publishInvasion(invasion, answered);
    }
  }
}
