import type { ProvinceEventDefinition } from '@/config/province-events';
import { isDefined } from '@/lib/value/isDefined';

import type { CalendarDate } from '../CalendarDate';
import type { General } from '../General';
import type { Province } from '../Province';
import { Incident, type IncidentChange } from './Incident';

export class IncidentBuilder {
  private readonly before: readonly [string, number][];

  public constructor(
    private readonly province: Province,
    private readonly recipient?: General,
  ) {
    this.before = this.getStats();
  }

  public build(
    definition: ProvinceEventDefinition,
    date: CalendarDate,
    details: { recipient?: string | undefined; monster?: string } = {},
  ): Incident {
    const changes = this.measureChanges();
    const recipient = details.recipient ?? this.recipient?.name;

    return new Incident({
      definition,
      date,
      province: this.province,
      changes,
      recipient,
      monster: details.monster,
    });
  }

  private measureChanges(): IncidentChange[] {
    const after = new Map(this.getStats());
    const changes: IncidentChange[] = [];

    for (const [stat, previous] of this.before) {
      const current = after.get(stat);

      if (isDefined(current) && previous !== current) {
        changes.push({ stat, before: previous, after: current });
      }
    }

    return changes;
  }

  private getStats(): [string, number][] {
    return [
      ...this.province.resources.entries,
      ...this.province.development.entries,
      ...(this.recipient?.stats.entries ?? []),
    ];
  }
}
