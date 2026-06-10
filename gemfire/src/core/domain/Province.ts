import { Development } from './Development';
import type { Family } from './Family';
import type { General } from './General';
import { Resources } from './Resources';

export interface ProvinceParams {
  readonly number: number;
  readonly name: string;
  readonly neighbors: readonly number[];
  readonly owner?: Family | undefined;
  readonly governor?: General | undefined;
  readonly resources?: Resources;
  readonly development?: Development;
}

export class Province {
  public readonly number: number;
  public readonly name: string;
  public readonly neighbors: readonly number[];
  public resources: Resources;
  public development: Development;
  public owner?: Family | undefined;
  public governor?: General | undefined;

  public constructor(params: ProvinceParams) {
    this.number = params.number;
    this.name = params.name;
    this.neighbors = params.neighbors;
    this.owner = params.owner;
    this.governor = params.governor;
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
