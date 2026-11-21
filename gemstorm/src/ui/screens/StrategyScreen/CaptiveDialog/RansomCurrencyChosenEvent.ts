import type { RansomCurrency } from '@/core/domain/Ransom';

export class RansomCurrencyChosenEvent {
  public constructor(public readonly currency: RansomCurrency) {}
}
