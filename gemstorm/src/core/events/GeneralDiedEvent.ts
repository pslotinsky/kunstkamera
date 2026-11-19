import type { Family } from '@/core/domain/Family';
import type { General } from '@/core/domain/General';

export class GeneralDiedEvent {
  public constructor(
    public readonly general: General,
    public readonly family: Family | undefined,
  ) {}
}
