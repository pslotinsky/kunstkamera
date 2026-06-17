import { Stats, type StatsParams } from './Stats';

const DEVELOPMENT_MAXES = {
  loyalty: 100,
  cultivation: 200,
  protection: 200,
};

export type DevelopmentKey = keyof typeof DEVELOPMENT_MAXES;

export type DevelopmentGains = StatsParams<DevelopmentKey>;

export class Development extends Stats<DevelopmentKey> {
  public static empty(): Development {
    return new Development({});
  }

  public static from(definition: {
    readonly loyalty: number;
    readonly cultivation: number;
    readonly protection: number;
  }): Development {
    return new Development(definition);
  }

  declare readonly loyalty: number;
  declare readonly cultivation: number;
  declare readonly protection: number;

  protected constructor(values: DevelopmentGains) {
    super(values, DEVELOPMENT_MAXES);
  }
}
