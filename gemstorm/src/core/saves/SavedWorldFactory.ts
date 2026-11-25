import { ADVISORS } from '@/config/advisors';
import { ARTIFACTS } from '@/config/artifacts';
import { SCENARIOS } from '@/config/scenarios';
import { Advisor } from '@/core/domain/Advisor';
import { CalendarDate } from '@/core/domain/CalendarDate';
import { MarketRate } from '@/core/domain/MarketRate';
import { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

import { PopulationRestorer } from './PopulationRestorer';
import { ProvinceRestorer } from './ProvinceRestorer';
import type { SaveData } from './SaveFile';

const MARKET_RATES = [MarketRate.LOW, MarketRate.AVERAGE, MarketRate.HIGH];

export class SavedWorldFactory {
  public create(data: SaveData): World {
    const provinces = ProvinceRestorer.restore(data.provinces);
    const population = PopulationRestorer.restore(data, provinces.map);

    provinces.restoreGovernment(population);

    const world = this.createWorld(data, provinces, population);

    population.restoreCaptivesAndExiles(world);
    this.validatePlayerTurn(world);

    return world;
  }

  private createWorld(
    data: SaveData,
    provinces: ProvinceRestorer,
    population: PopulationRestorer,
  ): World {
    const { families, generals } = population;
    const player = families.getOrFail(data.player);
    const turnQueue = provinces.restoreTurnQueue(data.order, data.turnIndex);
    const date = new CalendarDate(data.date.year, data.date.month);
    const advisor = this.restoreAdvisor(data.advisor);
    const scenario = this.restoreScenario(data.scenario);
    const artifacts = data.artifacts.map((name) => this.findArtifact(name));
    const marketRate = this.restoreMarketRate(data.market);

    return new World({
      date,
      map: provinces.map,
      families,
      generals,
      player,
      advisor,
      scenario,
      turnQueue,
      artifacts,
      marketRate,
    });
  }

  private validatePlayerTurn(world: World): void {
    const { current } = world.turnQueue;

    if (!isDefined(current) || !world.isPlayerRun(current)) {
      throw new Error('Invalid saved turn');
    }
  }

  private restoreScenario(scenarioNumber: number): number {
    const scenario = SCENARIOS.find(({ number }) => number === scenarioNumber);

    if (!isDefined(scenario)) {
      throw new Error('Unknown saved scenario');
    }

    return scenario.number;
  }

  private restoreAdvisor(name: SaveData['advisor']): Advisor | undefined {
    let advisor: Advisor | undefined;

    if (name !== null) {
      const definition = ADVISORS.find((candidate) => candidate.name === name);
      if (!isDefined(definition)) {
        throw new Error(`Unknown saved advisor: ${name}`);
      }

      advisor = new Advisor(definition);
    }

    return advisor;
  }

  private findArtifact(name: string) {
    const artifact = ARTIFACTS.find((candidate) => candidate.name === name);

    if (!isDefined(artifact)) {
      throw new Error(`Unknown saved artifact: ${name}`);
    }

    return artifact;
  }

  private restoreMarketRate(market: SaveData['market']): MarketRate {
    const rate = MARKET_RATES.find(({ name }) => name === market);

    if (!isDefined(rate)) {
      throw new Error('Unknown saved market rate');
    }

    return rate;
  }
}
