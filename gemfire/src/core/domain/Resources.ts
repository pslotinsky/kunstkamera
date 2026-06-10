export class Resources {
  public static createEmpty(): Resources {
    return new Resources(0, 0, 0);
  }

  public constructor(
    public readonly gold: number,
    public readonly food: number,
    public readonly troops: number,
  ) {}
}
