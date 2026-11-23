import type { Province } from '@/core/domain/Province';
import type { StationedHiredUnit } from '@/core/domain/province-events/HiredUnitSelector';
import type { Incident } from '@/core/domain/province-events/Incident';
import {
  type ProvinceEventResolution,
  ProvinceEventResolver,
} from '@/core/domain/province-events/ProvinceEventResolver';
import { IncidentReportedEvent } from '@/core/events/IncidentReportedEvent';
import { UnitDesertedEvent } from '@/core/events/UnitDesertedEvent';
import { isDefined } from '@/lib/value/isDefined';

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
    const resolver = new ProvinceEventResolver(world);
    const resolution = resolver.resolve();
    const updatedProvinces = this.collectUpdatedProvinces(resolution);

    this.pending = resolution.incidents;
    this.reportDesertion(resolution.desertion);
    this.publishUpdates(updatedProvinces);
  }

  private reportDesertion(desertion: StationedHiredUnit | undefined): void {
    if (isDefined(desertion)) {
      const { province, unit } = desertion;

      this.publish(new UnitDesertedEvent(province, unit, 'faithless'));
    }
  }

  private collectUpdatedProvinces(
    resolution: ProvinceEventResolution,
  ): readonly Province[] {
    const { incidents, desertion } = resolution;
    const updatedProvinces = new Set<Province>();

    for (const incident of incidents) {
      updatedProvinces.add(incident.province);
    }
    if (isDefined(desertion)) {
      updatedProvinces.add(desertion.province);
    }

    return [...updatedProvinces];
  }
}
