import { Resources } from './Resources';
import { Development } from './Development';
import type { Family } from './Family';
import type { General } from './General';

export interface ProvinceParams {
  readonly number: number;
  readonly name: string;
  readonly neighbors: readonly number[];
  readonly resources?: Resources;
  readonly development?: Development;
}

export class Province {
  public readonly number: number;
  public readonly name: string;
  public readonly neighbors: readonly number[];
  public resources: Resources;
  public development: Development;
  public owner?: Family;
  public governor?: General;

  public constructor(params: ProvinceParams) {
    this.number = params.number;
    this.name = params.name;
    this.neighbors = params.neighbors;
    this.resources = params.resources ?? Resources.createEmpty();
    this.development = params.development ?? Development.createEmpty();
  }

  public isNeighbor(other: Province | number): boolean {
    const otherNumber = typeof other === 'number' ? other : other.number;
    return this.neighbors.includes(otherNumber);
  }

  public toString(): string {
    return `${this.number} ${this.name}`;
  }
}
