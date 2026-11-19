import type { BattleOutcome } from '@/core/domain/BattleOutcome';
import type { Province } from '@/core/domain/Province';

export class BattleEndedEvent {
  public constructor(
    public readonly outcome: BattleOutcome,
    public readonly refuge?: Province | undefined,
  ) {}
}
