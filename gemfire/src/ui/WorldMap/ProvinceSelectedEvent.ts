export class ProvinceSelectedEvent extends CustomEvent<number> {
  public constructor(provinceNumber: number) {
    super(ProvinceSelectedEvent.name, { detail: provinceNumber });
  }

  public get provinceNumber(): number {
    return this.detail;
  }
}
