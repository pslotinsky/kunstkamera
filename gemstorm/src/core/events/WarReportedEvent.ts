import type { InvasionReport } from '@/core/domain/InvasionReport';

export class WarReportedEvent {
  public constructor(public readonly report: InvasionReport) {}
}
