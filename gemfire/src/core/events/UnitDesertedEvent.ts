import type { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';

export type DesertionReason = 'unpaid' | 'faithless';

export class UnitDesertedEvent {
  public constructor(
    public readonly province: Province,
    public readonly unit: HiredUnit,
    public readonly reason: DesertionReason,
  ) {}
}
