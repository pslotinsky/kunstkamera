import type { Province } from './Province';

export class WorldMap {
  public readonly provinces: readonly Province[];

  private readonly provincesByNumber: Map<number, Province>;

  public constructor(provinces: readonly Province[]) {
    this.provinces = provinces;
    this.provincesByNumber = new Map(
      provinces.map((province) => [province.number, province]),
    );
  }

  public getProvince(number: number): Province {
    const province = this.provincesByNumber.get(number);

    if (province === undefined) {
      throw new Error(`No province numbered ${number}`);
    }

    return province;
  }

  public getNeighbors(province: Province | number): Province[] {
    const origin =
      typeof province === 'number' ? this.getProvince(province) : province;

    return origin.neighbors.map((neighborNumber) =>
      this.getProvince(neighborNumber),
    );
  }
}
