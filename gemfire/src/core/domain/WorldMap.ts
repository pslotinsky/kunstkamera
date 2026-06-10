import type { Province } from './Province';

export class WorldMap {
  private readonly provincesByNumber: Map<number, Province>;

  public constructor(provinces: Map<number, Province>) {
    this.provincesByNumber = provinces;
  }

  public get provinces(): readonly Province[] {
    return [...this.provincesByNumber.values()];
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
