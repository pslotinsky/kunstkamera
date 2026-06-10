import type { Collection } from '@/lib/Collection';

import type { Province } from './Province';

export class WorldMap {
  private readonly provincesCollection: Collection<number, Province>;

  public constructor(provinces: Collection<number, Province>) {
    this.provincesCollection = provinces;
  }

  public get provinces(): readonly Province[] {
    return this.provincesCollection.all;
  }

  public getProvince(number: number): Province {
    return this.provincesCollection.getOrFail(number);
  }

  public getNeighbors(province: Province | number): Province[] {
    const origin =
      typeof province === 'number'
        ? this.provincesCollection.getOrFail(province)
        : province;

    return origin.neighbors.map((neighborNumber) =>
      this.provincesCollection.getOrFail(neighborNumber),
    );
  }
}
