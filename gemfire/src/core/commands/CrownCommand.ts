import type { Coronation } from '@/core/domain/Coronation';
import type { General } from '@/core/domain/General';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export class CrownCommand extends WorldCommand {
  private coronation: Coronation | undefined;
  private heir: General | undefined;

  public constructor(context: WorldCommandContext) {
    super('Crown', context);
  }

  public crown(coronation: Coronation, heir: General): void {
    this.coronation = coronation;
    this.heir = heir;
  }

  public override consumesTurn(): boolean {
    return false;
  }

  public execute(): void {
    if (this.coronation && this.heir) {
      this.coronation.crown(this.heir);
      this.publishUpdates(this.coronation.provinces);
    }
  }
}
