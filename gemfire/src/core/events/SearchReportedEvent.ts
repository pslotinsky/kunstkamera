import type { FifthUnit } from '@/core/domain/FifthUnit';
import type { Province } from '@/core/domain/Province';

export class SearchReportedEvent {
  public constructor(
    public readonly province: Province,
    public readonly units: readonly FifthUnit[],
  ) {}
}
