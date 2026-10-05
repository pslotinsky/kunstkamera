import { PROVINCES } from '@/config/provinces';
import {
  type FamilyDefinition,
  SCENARIOS,
  type Scenario,
} from '@/config/scenarios';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { Characteristics } from '@/core/domain/Characteristics';
import { Development } from '@/core/domain/Development';
import { Family } from '@/core/domain/Family';
import { Gem } from '@/core/domain/Gem';
import { General, LIFESPAN_MONTHS } from '@/core/domain/General';
import { Province } from '@/core/domain/Province';
import { Resources } from '@/core/domain/Resources';
import { World } from '@/core/domain/World';
import { WorldMap } from '@/core/domain/WorldMap';
import { Collection } from '@/lib/Collection';

const START_MONTH = 1;
const MONTHS_PER_YEAR = 12;
const DEATH_SPREAD_MONTHS = 3;

// TODO: replaced by the family chosen at new-game setup (feature 13)
const playerFamily = 'Blanche';

export class WorldFactory {
  public create(): World {
    const scenario = this.defaultScenario();

    const generals = this.createGenerals(scenario);
    const provinces = this.createProvinces(scenario);
    const families = this.createFamilies(scenario, generals, provinces);

    this.settleProvinces(scenario, families, generals, provinces);

    const player = families.getOrFail(playerFamily);

    return new World({
      date: new CalendarDate(scenario.year, START_MONTH),
      map: new WorldMap(provinces),
      families,
      generals,
      player,
    });
  }

  private defaultScenario(): Scenario {
    const scenario = SCENARIOS[0];

    if (scenario === undefined) {
      throw new Error('No scenario defined');
    }

    return scenario;
  }

  private createGenerals(scenario: Scenario): Collection<string, General> {
    const generals = new Map<string, General>();

    for (const definition of scenario.generals) {
      const birth = new CalendarDate(definition.birth, this.randomMonth());

      generals.set(
        definition.name,
        new General({
          name: definition.name,
          stats: Characteristics.from(definition),
          birth,
          deathDate: this.scheduleDeath(birth),
          lineage: definition.lineage,
        }),
      );
    }

    return new Collection(generals, 'general');
  }

  private randomMonth(): number {
    return Math.floor(Math.random() * MONTHS_PER_YEAR) + 1;
  }

  private scheduleDeath(birth: CalendarDate): CalendarDate {
    const spread =
      Math.floor(Math.random() * (DEATH_SPREAD_MONTHS * 2 + 1)) -
      DEATH_SPREAD_MONTHS;

    return birth.plus(LIFESPAN_MONTHS + spread);
  }

  private createProvinces(scenario: Scenario): Collection<number, Province> {
    const definitions = new Map(
      scenario.provinces.map((definition) => [definition.number, definition]),
    );

    const provinces = new Map<number, Province>();

    for (const geography of PROVINCES) {
      const definition = definitions.get(geography.number);

      if (!definition) {
        throw new Error(
          `No scenario definition for province ${geography.number}`,
        );
      }

      provinces.set(
        geography.number,
        new Province({
          number: geography.number,
          name: geography.name,
          neighbors: geography.neighbors,
          landscape: geography.landscape,
          resources: Resources.from(definition),
          development: Development.from(definition),
          hirePool: definition.hirePool,
        }),
      );
    }

    return new Collection(provinces, 'province');
  }

  private createFamilies(
    scenario: Scenario,
    generals: Collection<string, General>,
    provinces: Collection<number, Province>,
  ): Collection<string, Family> {
    const families = new Map<string, Family>();

    for (const definition of scenario.families) {
      const home = this.findHomeProvince(definition, scenario, provinces);

      families.set(
        definition.name,
        this.createFamily(definition, generals, home),
      );
    }

    return new Collection(families, 'family');
  }

  private createFamily(
    definition: FamilyDefinition,
    generals: Collection<string, General>,
    homeProvince: Province,
  ): Family {
    return new Family({
      name: definition.name,
      ruler: generals.getOrFail(definition.ruler),
      members: definition.members.map((name) => generals.getOrFail(name)),
      homeProvince,
      fame: definition.fame,
      gems: definition.gems.map((name) => Gem.ofName(name)),
      royal: definition.royal,
    });
  }

  private findHomeProvince(
    definition: FamilyDefinition,
    scenario: Scenario,
    provinces: Collection<number, Province>,
  ): Province {
    const seat = scenario.provinces.find(
      (province) => province.governor === definition.ruler,
    );

    if (!seat) {
      throw new Error(`No home province for family ${definition.name}`);
    }

    return provinces.getOrFail(seat.number);
  }

  private settleProvinces(
    scenario: Scenario,
    families: Collection<string, Family>,
    generals: Collection<string, General>,
    provinces: Collection<number, Province>,
  ): void {
    for (const definition of scenario.provinces) {
      const province = provinces.getOrFail(definition.number);
      const family = definition.family
        ? families.getOrFail(definition.family)
        : undefined;
      const resident = definition.governor
        ? generals.getOrFail(definition.governor)
        : undefined;

      if (family) {
        province.claim(family);
      }

      province.assignGovernor(resident ?? family?.ruler);
    }
  }
}
