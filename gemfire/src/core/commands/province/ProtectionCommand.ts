import type { DevelopmentGains } from '@/core/domain/Development';

import type { WorldCommandContext } from '../ProvinceCommand';
import { DevelopCommand } from './DevelopCommand';

export class ProtectionCommand extends DevelopCommand {
  public constructor(context: WorldCommandContext) {
    super('Protection', context);
  }

  protected gains(amount: number): DevelopmentGains {
    return { protection: amount };
  }
}
