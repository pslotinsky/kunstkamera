import type { Province } from '../Province';
import type { World } from '../World';
import { DisasterEventResolver } from './DisasterEventResolver';
import { GoodwillEventResolver } from './GoodwillEventResolver';
import {
  HiredUnitSelector,
  type StationedHiredUnit,
} from './HiredUnitSelector';
import type { Incident } from './Incident';
import { MercenaryDesertionResolver } from './MercenaryDesertionResolver';
import { RampageEventResolver } from './RampageEventResolver';

export interface ProvinceEventResolution {
  readonly incidents: readonly Incident[];
  readonly desertion: StationedHiredUnit | undefined;
}

export class ProvinceEventResolver {
  private readonly disasters: DisasterEventResolver;
  private readonly rampages: RampageEventResolver;
  private readonly goodwill: GoodwillEventResolver;
  private readonly mercenaryDesertion: MercenaryDesertionResolver;

  public constructor(
    private readonly world: World,
    random: () => number = Math.random,
  ) {
    const hiredUnitSelector = new HiredUnitSelector(random);

    this.disasters = new DisasterEventResolver(random);
    this.rampages = new RampageEventResolver(hiredUnitSelector, random);
    this.goodwill = new GoodwillEventResolver(world, random);
    this.mercenaryDesertion = new MercenaryDesertionResolver(hiredUnitSelector);
  }

  public resolve(): ProvinceEventResolution {
    const provinces = this.getOwnedProvinces();
    const { date } = this.world;
    const disasterAndRampageIncidents = [
      ...this.disasters.resolve(provinces, date),
      ...this.rampages.resolve(provinces, date),
    ];

    const desertion = this.mercenaryDesertion.resolve(provinces);
    const incidents = [
      ...disasterAndRampageIncidents,
      ...this.goodwill.resolve(provinces),
    ];

    return { incidents, desertion };
  }

  private getOwnedProvinces(): readonly Province[] {
    return this.world.map.provinces
      .filter((province) => province.hasOwner())
      .sort((left, right) => left.number - right.number);
  }
}
