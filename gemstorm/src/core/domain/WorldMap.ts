import type { Collection } from '@/lib/Collection';

import type { Family } from './Family';
import type { Province } from './Province';

export class WorldMap {
  private readonly provincesCollection: Collection<number, Province>;

  public constructor(provinces: Collection<number, Province>) {
    this.provincesCollection = provinces;
  }

  public get provinces(): readonly Province[] {
    return this.provincesCollection.all;
  }

  public getFamilyProvinces(family: Family): readonly Province[] {
    return this.provinces.filter((province) => province.belongsTo(family));
  }

  public getOwners(): readonly Family[] {
    const owners = this.provinces.flatMap((province) =>
      province.family ? [province.family] : [],
    );

    return [...new Set(owners)];
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
