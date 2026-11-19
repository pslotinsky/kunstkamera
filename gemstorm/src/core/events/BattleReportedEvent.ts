import type { InvasionReport } from '@/core/domain/InvasionReport';

export class BattleReportedEvent {
  public constructor(public readonly report: InvasionReport) {}
}
