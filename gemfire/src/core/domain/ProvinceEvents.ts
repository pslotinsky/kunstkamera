import {
  BAD_EVENTS,
  DISASTERS,
  EVENT_BALANCE,
  GOOD_EVENTS,
  type ProvinceEventDefinition,
  RAMPAGE,
} from '@/config/province-events';

import type { CalendarDate } from './CalendarDate';
import { Incident, type IncidentChange } from './Incident';
import { Pastha } from './Pastha';
import type { Province } from './Province';

export class ProvinceEvents {
  public constructor(
    private readonly provinces: readonly Province[],
    private readonly date: CalendarDate,
    private readonly random: () => number = Math.random,
  ) {}

  public resolve(): readonly Incident[] {
    const provinces = this.provinces
      .filter((province) => province.hasOwner())
      .sort((left, right) => left.number - right.number);
    const incidents: Incident[] = [];

    this.resolveDisasters(provinces, incidents);
    this.resolveRampages(provinces, incidents);
    this.resolveCycles(provinces, incidents);

    return incidents;
  }

  private resolveDisasters(
    provinces: readonly Province[],
    incidents: Incident[],
  ): void {
    for (const disaster of DISASTERS) {
      for (const province of provinces) {
        const eligible =
          disaster.months.includes(this.date.month) &&
          (disaster.provinces?.includes(province.number) ?? true);

        if (
          eligible &&
          this.canAffect(disaster, province) &&
          this.random() < EVENT_BALANCE.disasterChance
        ) {
          const incident = this.occur(disaster, province);

          incidents.push(incident);
        }
      }
    }
  }

  private resolveRampages(
    provinces: readonly Province[],
    incidents: Incident[],
  ): void {
    for (const province of provinces) {
      const monsters = province.hiredUnits.filter(
        (unit) => unit.category === 'monster',
      );

      if (
        monsters.length &&
        this.canAffect(RAMPAGE, province) &&
        this.random() < EVENT_BALANCE.rampageChance
      ) {
        const monster = monsters[Math.floor(this.random() * monsters.length)]!;
        const incident = this.occur(RAMPAGE, province, monster.name);

        incidents.push(incident);
      }
    }
  }

  private resolveCycles(
    provinces: readonly Province[],
    incidents: Incident[],
  ): void {
    for (const province of provinces) {
      if (province.isEventDue) {
        const definition = this.chooseEncounter(province);

        if (definition) {
          const incident = this.occur(definition, province);

          incidents.push(incident);
        }
        province.resetActionCycle();
      }
    }
  }

  private chooseEncounter(
    province: Province,
  ): ProvinceEventDefinition | undefined {
    const goodwill = province.goodwill;
    const magnitude = Math.min(Math.abs(goodwill), 3);
    const favoured = magnitude * EVENT_BALANCE.goodwillChance;
    const goodChance =
      goodwill > 0
        ? favoured
        : goodwill < 0
          ? EVENT_BALANCE.oppositeChance
          : EVENT_BALANCE.neutralChance;
    const badChance =
      goodwill < 0
        ? favoured
        : goodwill > 0
          ? EVENT_BALANCE.oppositeChance
          : EVENT_BALANCE.neutralChance;
    const roll = this.random();
    let candidates: readonly ProvinceEventDefinition[] = [];

    if (roll < goodChance) {
      candidates = GOOD_EVENTS;
    } else if (roll < goodChance + badChance * this.getMitigation(province)) {
      candidates = BAD_EVENTS;
    }

    const eligible = candidates.filter(
      (event) =>
        goodwill >= (event.minimumGoodwill ?? -Infinity) &&
        this.canAffect(event, province),
    );
    if (eligible.length === 0) {
      return undefined;
    }

    let cumulative = 0;
    const weighted = eligible.map((definition) => {
      cumulative += definition.weight ?? 4;
      return { definition, upper: cumulative };
    });
    const choice = this.random() * cumulative;

    return weighted.find((entry) => choice < entry.upper)?.definition;
  }

  private canAffect(
    definition: ProvinceEventDefinition,
    province: Province,
  ): boolean {
    if (definition.grantsPastha) {
      return true;
    }

    const resources = province.resources.increase(definition.resources ?? {});
    const development = province.development.increase(
      definition.development ?? {},
    );
    const stats = province.governor?.stats;
    const improved = stats?.increase(definition.characteristics ?? {});

    return (
      resources.entries.some(
        ([key, value]) => province.resources.get(key) !== value,
      ) ||
      development.entries.some(
        ([key, value]) => province.development.get(key) !== value,
      ) ||
      (improved?.entries.some(([key, value]) => stats!.get(key) !== value) ??
        false)
    );
  }

  private occur(
    definition: ProvinceEventDefinition,
    province: Province,
    monster?: string,
  ): Incident {
    const before = this.getStats(province);
    const mitigation = this.getMitigation(province);
    const resources = this.reduceLosses(definition.resources, mitigation);
    const development = this.reduceLosses(definition.development, mitigation);
    const recipient = definition.characteristics
      ? province.governor
      : undefined;

    province.addResources(resources);
    province.addDevelopment(development);
    if (recipient) {
      recipient.stats = recipient.stats.increase(
        definition.characteristics ?? {},
      );
    }
    if (definition.grantsPastha) {
      const pastha = new Pastha();

      province.addUnit(pastha);
    }

    const after = this.getStats(province);
    const changes: IncidentChange[] = before.flatMap(([stat, value], index) => {
      const changed = after[index]![1];
      return value !== changed ? [{ stat, before: value, after: changed }] : [];
    });

    return new Incident({
      definition,
      province,
      date: this.date,
      changes,
      recipient: recipient?.name,
      monster,
    });
  }

  private getMitigation(province: Province): number {
    return 1 - province.development.protection / EVENT_BALANCE.protectionScale;
  }

  private reduceLosses(
    gains: Readonly<Record<string, number | undefined>> | undefined,
    mitigation: number,
  ): Record<string, number> {
    return Object.fromEntries(
      Object.entries(gains ?? {}).map(([key, value]) => [
        key,
        value! < 0 ? Math.trunc(value! * mitigation) : value!,
      ]),
    );
  }

  private getStats(province: Province): [string, number][] {
    return [
      ...province.resources.entries,
      ...province.development.entries,
      ...(province.governor?.stats.entries ?? []),
    ];
  }
}
