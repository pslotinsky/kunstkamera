import type { TurnHold } from '@/core/TurnHold';

export class TurnHeldEvent {
  public readonly holder: TurnHold;

  public constructor(holder: TurnHold) {
    this.holder = holder;
  }
}
