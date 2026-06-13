import type { DevelopmentGains } from '@/core/domain/Development';

import type { WorldCommandContext } from '../ProvinceCommand';
import { DevelopCommand } from './DevelopCommand';

export class CultivationCommand extends DevelopCommand {
  public constructor(context: WorldCommandContext) {
    super('Cultivation', context);
  }

  protected gains(amount: number): DevelopmentGains {
    return { cultivation: amount };
  }
}
