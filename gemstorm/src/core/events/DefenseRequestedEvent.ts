import type { Invasion } from '@/core/domain/Invasion';

export class DefenseRequestedEvent {
  public constructor(public readonly invasion: Invasion) {}
}
