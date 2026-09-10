import type { BattleOutcome } from '@/core/domain/BattleOutcome';

export class BattleEndedEvent {
  public constructor(public readonly outcome: BattleOutcome) {}
}
