import { EVENT_BALANCE, RAMPAGE } from '@/config/province-events';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import type { CalendarDate } from '../CalendarDate';
import type { DevelopmentGains } from '../Development';
import type { Province } from '../Province';
import type { Incident } from './Incident';
import { IncidentBuilder } from './IncidentBuilder';

export class RampageEventResolver {
  public constructor(
    private readonly date: CalendarDate,
    private readonly random: () => number,
  ) {}

  public resolve(provinces: readonly Province[]): readonly Incident[] {
    const incidents: Incident[] = [];

    for (const province of provinces) {
      const incident = this.resolveProvince(province);

      if (isDefined(incident)) {
        incidents.push(incident);
      }
    }

    return incidents;
  }

  private resolveProvince(province: Province): Incident | undefined {
    const monsters = province.hiredUnits.filter(
      (unit) => unit.category === 'monster',
    );
    let incident: Incident | undefined;

    if (
      monsters.length > 0 &&
      this.canRampage(province) &&
      this.random() < EVENT_BALANCE.rampageChance
    ) {
      const monster = sample(monsters, this.random);

      incident = this.apply(province, monster.name);
    }

    return incident;
  }

  private apply(province: Province, monster: string): Incident {
    const incidentBuilder = new IncidentBuilder(province);
    const development = this.calculateLosses(province);

    province.reduceDevelopment(development);

    return incidentBuilder.build(RAMPAGE, this.date, { monster });
  }

  private calculateLosses(province: Province): DevelopmentGains {
    const { protection } = province.development;
    const damageShare = 1 - protection / EVENT_BALANCE.rampageProtectionScale;
    const losses: DevelopmentGains = {};

    for (const [key] of province.development.entries) {
      const damage = RAMPAGE.development?.[key];

      if (isDefined(damage)) {
        losses[key] = -Math.trunc(damage * damageShare);
      }
    }

    return losses;
  }

  private canRampage(province: Province): boolean {
    return province.development.entries.some(
      ([key, value]) => value > 0 && isDefined(RAMPAGE.development?.[key]),
    );
  }
}
