import { PROVINCES } from '@/config/provinces';
import {
  FAMILIES,
  SCENARIOS,
  type ScenarioDefinition,
} from '@/config/scenarios';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { Family } from '@/core/domain/Family';
import { Province } from '@/core/domain/Province';
import { World } from '@/core/domain/World';
import { WorldMap } from '@/core/domain/WorldMap';

const startDate = new CalendarDate(1186, 4);

export class WorldFactory {
  public create(): World {
    const scenario = this.createDefaultScenario();
    const families = this.createFamilies(scenario);
    const map = this.createMap(scenario, families);

    return new World({ date: startDate, map, families });
  }

  private createDefaultScenario(): ScenarioDefinition {
    const scenario = SCENARIOS[0];

    if (scenario === undefined) {
      throw new Error('No scenario defined');
    }

    return scenario;
  }

  private createFamilies(scenario: ScenarioDefinition): Family[] {
    return Object.keys(scenario.ownership).map((name) =>
      this.createFamily(name),
    );
  }

  private createMap(
    scenario: ScenarioDefinition,
    families: Family[],
  ): WorldMap {
    const provinceOwners = this.collectProvinceOwners(scenario, families);

    const provinces = PROVINCES.map(
      (province) =>
        new Province({
          ...province,
          owner: provinceOwners.get(province.number),
        }),
    );

    return new WorldMap(provinces);
  }

  private createFamily(name: string): Family {
    const definition = FAMILIES.find((family) => family.name === name);

    if (definition === undefined) {
      throw new Error(`Unknown family in scenario ownership: ${name}`);
    }

    return new Family({ name: definition.name, color: definition.color });
  }

  private collectProvinceOwners(
    scenario: ScenarioDefinition,
    families: Family[],
  ): Map<number, Family> {
    const owners = new Map<number, Family>();

    for (const family of families) {
      for (const provinceNumber of scenario.ownership[family.name] ?? []) {
        owners.set(provinceNumber, family);
      }
    }

    return owners;
  }
}
