import type { World } from '../World';
import { DisasterEventResolver } from './DisasterEventResolver';
import { GoodwillEventResolver } from './GoodwillEventResolver';
import type { Incident } from './Incident';
import { RampageEventResolver } from './RampageEventResolver';

export class ProvinceEventResolver {
  public constructor(
    private readonly world: World,
    private readonly random: () => number = Math.random,
  ) {}

  public resolve(): readonly Incident[] {
    const provinces = this.world.map.provinces
      .filter((province) => province.hasOwner())
      .sort((left, right) => left.number - right.number);
    const { date } = this.world;
    const disasters = new DisasterEventResolver(date, this.random);
    const rampages = new RampageEventResolver(date, this.random);
    const goodwill = new GoodwillEventResolver(this.world, this.random);

    return [
      ...disasters.resolve(provinces),
      ...rampages.resolve(provinces),
      ...goodwill.resolve(provinces),
    ];
  }
}
