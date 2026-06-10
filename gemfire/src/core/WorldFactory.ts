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

const startDate = new CalendarDate(1186, 4);

export class WorldFactory {
  public create(): World {
    const scenario = this.defaultScenario();

    const generals = this.createGenerals(scenario);
    const families = this.createFamilies(scenario, generals);
    const provinces = this.createProvinces(scenario, families, generals);
    const map = new WorldMap(provinces);

    this.assignHomeProvinces(scenario, families, provinces);

    return new World({
      date: startDate,
      map,
      families: [...families.values()],
      generals: [...generals.values()],
    });
  }

  private defaultScenario(): Scenario {
    const scenario = SCENARIOS[0];

    if (scenario === undefined) {
      throw new Error('No scenario defined');
    }

    return scenario;
  }

  private createGenerals(scenario: Scenario): Map<string, General> {
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

    return generals;
  }

  private createFamilies(
    scenario: Scenario,
    generals: Map<string, General>,
  ): Map<string, Family> {
    const families = new Map<string, Family>();

    for (const definition of scenario.families) {
      families.set(definition.name, this.createFamily(definition, generals));
    }

    return families;
  }

  private createFamily(
    definition: FamilyDefinition,
    generals: Map<string, General>,
  ): Family {
    return new Family({
      name: definition.name,
      color: this.getFamilyColor(definition.name),
      ruler: this.getGeneralOrFail(generals, definition.ruler),
      members: definition.members.map((name) =>
        this.getGeneralOrFail(generals, name),
      ),
      fame: definition.fame,
    });
  }

  private createProvinces(
    scenario: Scenario,
    families: Map<string, Family>,
    generals: Map<string, General>,
  ): Map<number, Province> {
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

    return provinces;
  }

  private createProvince(
    geography: ProvinceData,
    definition: ProvinceDefinition,
    families: Map<string, Family>,
    generals: Map<string, General>,
  ): Province {
    const owner = definition.owner ? families.get(definition.owner) : undefined;
    const resident = definition.governor
      ? this.getGeneralOrFail(generals, definition.governor)
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
    families: Map<string, Family>,
    provinces: Map<number, Province>,
  ): void {
    for (const family of families.values()) {
      const seat = scenario.provinces.find(
        (definition) => definition.governor === family.ruler?.name,
      );

      if (seat) {
        family.homeProvince = provinces.get(seat.number);
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

  private getGeneralOrFail(
    generals: Map<string, General>,
    name: string,
  ): General {
    const general = generals.get(name);

    if (general === undefined) {
      throw new Error(`Unknown general: ${name}`);
    }

    return general;
  }
}
