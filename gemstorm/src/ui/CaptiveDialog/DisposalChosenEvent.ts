import type { Disposal } from '@/core/domain/Captivity';

export class DisposalChosenEvent {
  public constructor(public readonly disposal: Disposal) {}
}
