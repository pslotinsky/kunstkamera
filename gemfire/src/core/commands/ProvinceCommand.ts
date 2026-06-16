import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export type { WorldCommandContext };

export abstract class ProvinceCommand extends WorldCommand {
  protected complete(province: Province, goodwill = 0): void {
    this.publish(new ProvinceUpdatedEvent(province));

    if (this.consumesTurn()) {
      this.recordAction(goodwill);
    }
  }

  protected recordAction(goodwill = 0): void {
    const { turnQueue } = this.context.world;

    turnQueue.current?.recordAction(goodwill);
  }
}
