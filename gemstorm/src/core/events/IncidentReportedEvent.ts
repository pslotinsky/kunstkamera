import type { Incident } from '@/core/domain/province-events/Incident';

export class IncidentReportedEvent {
  public constructor(public readonly incident: Incident) {}
}
