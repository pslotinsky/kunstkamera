import { Stats, type StatsParams } from './Stats';

export const RESOURCE_MAXES = {
  gold: 999,
  food: 999,
  troops: 999,
};

export type ResourceKey = keyof typeof RESOURCE_MAXES;

export type ResourceGains = StatsParams<ResourceKey>;

export class Resources extends Stats<ResourceKey> {
  public static empty(): Resources {
    return new Resources({});
  }

  public static from(definition: ResourceGains): Resources {
    return new Resources(definition);
  }

  declare readonly gold: number;
  declare readonly food: number;
  declare readonly troops: number;

  protected constructor(values: ResourceGains) {
    super(values, RESOURCE_MAXES);
  }
}
