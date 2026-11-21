import type { VassalOffer } from '@/core/domain/WanderingGenerals';

export class VassalOfferedEvent {
  public constructor(public readonly offer: VassalOffer) {}
}
