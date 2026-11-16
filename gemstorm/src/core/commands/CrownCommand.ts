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

  public override isBlocked(): boolean {
    return this.context.world.campaign.isEnded;
  }

  public execute(): void {
    if (
      this.coronation &&
      this.heir &&
      this.coronation.heirs.includes(this.heir)
    ) {
      this.coronation.crown(this.heir);
      this.context.world.campaign.confirmHeir(this.coronation);
      this.publishUpdates(this.coronation.provinces);
    }
  }
}
