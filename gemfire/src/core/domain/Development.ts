export class Development {
  public static createEmpty(): Development {
    return new Development(0, 0, 0);
  }

  public constructor(
    public readonly loyalty: number,
    public readonly cultivation: number,
    public readonly protection: number,
  ) {}
}
