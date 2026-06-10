import { PROVINCES, type ProvinceData } from '@/config/provinces';
import {
  FAMILIES,
  type FamilyDefinition,
  type ProvinceDefinition,
  SCENARIOS,
  type Scenario,
} from '@/config/scenarios';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { Development } from '@/core/domain/Development';
import { Family } from '@/core/domain/Family';
import { General } from '@/core/domain/General';
import { Province } from '@/core/domain/Province';
import { Resources } from '@/core/domain/Resources';
import { Stats } from '@/core/domain/Stats';
import { World } from '@/core/domain/World';
import { WorldMap } from '@/core/domain/WorldMap';
import { Collection } from '@/lib/Collection';

const startDate = new CalendarDate(1186, 4);

// TODO: replaced by the family chosen at new-game setup (feature 13)
const playerFamily = 'Blanche';

export class WorldFactory {
  public create(): World {
    const scenario = this.defaultScenario();

    const generals = this.createGenerals(scenario);
    const families = this.createFamilies(scenario, generals);
    const provinces = this.createProvinces(scenario, families, generals);
    const map = new WorldMap(provinces);

    this.assignHomeProvinces(scenario, families, provinces);

    const player = families.getOrFail(playerFamily);

    return new World({ date: startDate, map, families, generals, player });
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
      generals.set(
        definition.name,
        new General({
          name: definition.name,
          stats: new Stats(
            definition.intelligence,
            definition.war,
            definition.charisma,
          ),
        }),
      );
    }

    return new Collection(generals, 'general');
  }

  private createFamilies(
    scenario: Scenario,
    generals: Collection<string, General>,
  ): Collection<string, Family> {
    const families = new Map<string, Family>();

    for (const definition of scenario.families) {
      families.set(definition.name, this.createFamily(definition, generals));
    }

    return new Collection(families, 'family');
  }

  private createFamily(
    definition: FamilyDefinition,
    generals: Collection<string, General>,
  ): Family {
    return new Family({
      name: definition.name,
      color: this.getFamilyColor(definition.name),
      ruler: generals.getOrFail(definition.ruler),
      members: definition.members.map((name) => generals.getOrFail(name)),
      fame: definition.fame,
    });
  }

  private createProvinces(
    scenario: Scenario,
    families: Collection<string, Family>,
    generals: Collection<string, General>,
  ): Collection<number, Province> {
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
        this.createProvince(geography, definition, families, generals),
      );
    }

    return new Collection(provinces, 'province');
  }

  private createProvince(
    geography: ProvinceData,
    definition: ProvinceDefinition,
    families: Collection<string, Family>,
    generals: Collection<string, General>,
  ): Province {
    const owner = definition.owner
      ? families.getOrFail(definition.owner)
      : undefined;
    const resident = definition.governor
      ? generals.getOrFail(definition.governor)
      : undefined;

    return new Province({
      number: geography.number,
      name: geography.name,
      neighbors: geography.neighbors,
      owner,
      governor: resident ?? owner?.ruler,
      resources: new Resources(
        definition.gold,
        definition.food,
        definition.troops,
      ),
      development: new Development(
        definition.loyalty,
        definition.cultivation,
        definition.protection,
      ),
    });
  }

  private assignHomeProvinces(
    scenario: Scenario,
    families: Collection<string, Family>,
    provinces: Collection<number, Province>,
  ): void {
    for (const family of families.all) {
      const seat = scenario.provinces.find(
        (definition) => definition.governor === family.ruler?.name,
      );

      if (seat) {
        family.homeProvince = provinces.getOrFail(seat.number);
      }
    }
  }

  private getFamilyColor(name: string): string {
    const family = FAMILIES.find((entry) => entry.name === name);

    if (family === undefined) {
      throw new Error(`No color defined for family: ${name}`);
    }

    return family.color;
  }
}
