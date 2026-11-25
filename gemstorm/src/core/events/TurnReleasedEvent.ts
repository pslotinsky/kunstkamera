import type { TurnHold } from '@/core/TurnHold';

export class TurnReleasedEvent {
  public readonly holder: TurnHold;

  public constructor(holder: TurnHold) {
    this.holder = holder;
  }
}
