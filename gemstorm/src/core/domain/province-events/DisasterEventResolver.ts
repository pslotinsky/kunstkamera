import { DISASTERS, type DisasterDefinition } from '@/config/province-events';
import { isDefined } from '@/lib/value/isDefined';

import type { CalendarDate } from '../CalendarDate';
import type { Province } from '../Province';
import type { Stats, StatsParams } from '../Stats';
import type { Incident } from './Incident';
import { IncidentBuilder } from './IncidentBuilder';

const MAX_DISASTER_PROTECTION = 100;

export class DisasterEventResolver {
  public constructor(
    private readonly date: CalendarDate,
    private readonly random: () => number,
  ) {}

  public resolve(provinces: readonly Province[]): readonly Incident[] {
    const incidents: Incident[] = [];

    const activeDisasters = DISASTERS.filter((disaster) =>
      disaster.months.includes(this.date.month),
    );

    for (const disaster of activeDisasters) {
      for (const province of provinces) {
        const incident = this.resolveProvince(disaster, province);

        if (isDefined(incident)) {
          incidents.push(incident);
        }
      }
    }

    return incidents;
  }

  private resolveProvince(
    disaster: DisasterDefinition,
    province: Province,
  ): Incident | undefined {
    const eligible = disaster.provinces?.includes(province.number) ?? true;
    const occurs = eligible && this.rollDisaster(disaster, province);

    return occurs ? this.apply(disaster, province) : undefined;
  }

  private rollDisaster(
    disaster: DisasterDefinition,
    province: Province,
  ): boolean {
    const { chance } = disaster;
    const { loyalty } = province.development;
    const probability = typeof chance === 'number' ? chance : chance(loyalty);

    return this.random() < probability;
  }

  private apply(
    disaster: DisasterDefinition,
    province: Province,
  ): Incident | undefined {
    const incidentBuilder = new IncidentBuilder(province);

    this.applyLosses(disaster, province);

    const incident = incidentBuilder.build(disaster, this.date);

    return incident.changes.length > 0 ? incident : undefined;
  }

  private applyLosses(disaster: DisasterDefinition, province: Province): void {
    const { lossDivisor } = disaster;
    const damagePercent = this.calculateDamagePercent(disaster, province);
    const resourceLosses = this.calculateLosses(
      province.resources,
      disaster.resourceLosses,
      lossDivisor,
      damagePercent,
    );
    const developmentLosses = this.calculateLosses(
      province.development,
      disaster.developmentLosses,
      lossDivisor,
      damagePercent,
    );

    province.reduceResources(resourceLosses);
    province.reduceDevelopment(developmentLosses);
  }

  private calculateDamagePercent(
    disaster: DisasterDefinition,
    province: Province,
  ): number {
    const protection = disaster.mitigated ? province.development.protection : 0;

    return Math.max(0, MAX_DISASTER_PROTECTION - protection);
  }

  private calculateLosses<Key extends string>(
    stats: Stats<Key>,
    keys: readonly Key[],
    divisor: number,
    damagePercent: number,
  ): StatsParams<Key> {
    const losses: StatsParams<Key> = {};

    for (const key of keys) {
      const baseLoss = Math.floor(stats.get(key) / divisor);

      losses[key] = Math.floor(
        (baseLoss * damagePercent) / MAX_DISASTER_PROTECTION,
      );
    }

    return losses;
  }
}
