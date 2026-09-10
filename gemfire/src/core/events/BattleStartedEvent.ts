import type { Battle } from '@/core/domain/Battle';
import type { Invasion } from '@/core/domain/Invasion';

export class BattleStartedEvent {
  public constructor(
    public readonly invasion: Invasion,
    public readonly battle: Battle,
  ) {}
}
