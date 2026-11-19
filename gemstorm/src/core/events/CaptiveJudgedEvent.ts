import type { Captive } from '@/core/domain/Captive';
import type { DisposalOutcome } from '@/core/domain/Captivity';

export class CaptiveJudgedEvent {
  public constructor(
    public readonly captive: Captive,
    public readonly outcome: DisposalOutcome,
  ) {}
}
