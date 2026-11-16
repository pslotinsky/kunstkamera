import type { SuccessionOutcome } from '@/core/domain/Succession';

export type SuccessionCause = 'death' | 'banishment';

export class SuccessionReportedEvent {
  public constructor(
    public readonly outcome: SuccessionOutcome,
    public readonly cause: SuccessionCause,
  ) {}
}
