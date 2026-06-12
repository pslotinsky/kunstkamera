export interface ResourceGains {
  readonly gold?: number;
  readonly food?: number;
  readonly troops?: number;
}

export class Resources {
  public static createEmpty(): Resources {
    return new Resources(0, 0, 0);
  }

  public constructor(
    public readonly gold: number,
    public readonly food: number,
    public readonly troops: number,
  ) {}

  public add(gains: ResourceGains): Resources {
    return new Resources(
      this.gold + (gains.gold ?? 0),
      this.food + (gains.food ?? 0),
      this.troops + (gains.troops ?? 0),
    );
  }
}
