import { RAMPAGE } from '@/config/province-events';
import { isDefined } from '@/lib/value/isDefined';

import type { CalendarDate } from '../CalendarDate';
import type { HiredUnit } from '../HiredUnit';
import type { Province } from '../Province';
import type { HiredUnitSelector } from './HiredUnitSelector';
import type { Incident } from './Incident';
import { IncidentBuilder } from './IncidentBuilder';

const MIN_RESOURCE_LOSS = 10;
const MAX_RESOURCE_LOSS = 30;
const STRENGTH_PER_DEVELOPMENT_LOSS = 25;

export class RampageEventResolver {
  public constructor(
    private readonly hiredUnitSelector: HiredUnitSelector,
    private readonly random: () => number,
  ) {}

  public resolve(
    provinces: readonly Province[],
    date: CalendarDate,
  ): readonly Incident[] {
    const candidate = this.hiredUnitSelector.select(provinces, 'monster');
    let incident: Incident | undefined;

    if (isDefined(candidate)) {
      const { province, unit } = candidate;
      const fame = province.family?.fame ?? 0;

      if (unit.needsMoreFame(fame)) {
        incident = this.apply(province, unit, date);
      }
    }

    return isDefined(incident) ? [incident] : [];
  }

  private apply(
    province: Province,
    monster: HiredUnit,
    date: CalendarDate,
  ): Incident {
    const incidentBuilder = new IncidentBuilder(province);
    const gold = this.rollResourceLoss();
    const food = this.rollResourceLoss();
    const developmentLoss = Math.floor(
      monster.strength / STRENGTH_PER_DEVELOPMENT_LOSS,
    );

    province.reduceResources({ gold, food });
    province.reduceDevelopment({
      loyalty: developmentLoss,
      cultivation: developmentLoss,
    });

    return incidentBuilder.build(RAMPAGE, date, { monster: monster.name });
  }

  private rollResourceLoss(): number {
    const range = MAX_RESOURCE_LOSS - MIN_RESOURCE_LOSS + 1;

    return MIN_RESOURCE_LOSS + Math.floor(this.random() * range);
  }
}
