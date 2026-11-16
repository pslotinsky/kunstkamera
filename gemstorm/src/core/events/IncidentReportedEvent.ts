import type { Incident } from '@/core/domain/Incident';

export class IncidentReportedEvent {
  public constructor(public readonly incident: Incident) {}
}
