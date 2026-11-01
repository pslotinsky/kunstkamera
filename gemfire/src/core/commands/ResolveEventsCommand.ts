import type { Incident } from '@/core/domain/Incident';
import type { Province } from '@/core/domain/Province';
import { ProvinceEvents } from '@/core/domain/ProvinceEvents';
import { IncidentReportedEvent } from '@/core/events/IncidentReportedEvent';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

export class ResolveEventsCommand extends WorldCommand {
  private pending: readonly Incident[] = [];

  public constructor(context: WorldCommandContext) {
    super('Province events', context);
  }

  public report(province: Province): void {
    const incidents = this.pending.filter(
      (incident) => incident.province === province,
    );

    this.pending = this.pending.filter(
      (incident) => incident.province !== province,
    );
    for (const incident of incidents) {
      this.publish(new IncidentReportedEvent(incident));
    }
  }

  public execute(): void {
    const { world } = this.context;
    const events = new ProvinceEvents(world.map.provinces, world.date);
    this.pending = events.resolve();
    this.publishUpdates(this.pending.map((incident) => incident.province));
  }
}
