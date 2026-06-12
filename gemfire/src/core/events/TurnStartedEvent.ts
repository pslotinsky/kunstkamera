import type { Province } from '@/core/domain/Province';

export class TurnStartedEvent {
  public constructor(
    public readonly turnNumber: number,
    public readonly province: Province,
  ) {}
}
