import type { Province } from '@/core/domain/Province';

export class TurnStartedEvent extends CustomEvent<Province> {
  public constructor(province: Province) {
    super(TurnStartedEvent.name, { detail: province });
  }

  public get province(): Province {
    return this.detail;
  }
}
