import type { Province } from './Province';
import type { ResourceGains, ResourceKey } from './Resources';

export interface ShipmentParams {
  readonly source: Province;
  readonly target: Province;
  readonly cargo: ResourceGains;
}

export class Shipment {
  public static getMaximum(
    source: Province,
    target: Province,
    resource: ResourceKey,
  ): number {
    const stock = source.resources[resource];
    const room = target.getRoom(resource);
    const transferable = Math.min(stock, room);

    return Math.max(0, transferable);
  }

  public readonly source: Province;
  public readonly target: Province;
  public readonly cargo: ResourceGains;

  public constructor(params: ShipmentParams) {
    this.source = params.source;
    this.target = params.target;
    this.cargo = params.cargo;
  }

  public get isEmpty(): boolean {
    return this.amounts.every(([, amount]) => amount === 0);
  }

  public get isDeliverable(): boolean {
    return this.amounts.every(([resource, amount]) =>
      this.canDeliver(resource, amount),
    );
  }

  public deliver(): void {
    this.source.reduceResources(this.cargo);
    this.target.addResources(this.cargo);
  }

  private canDeliver(resource: ResourceKey, amount: number): boolean {
    const isWhole = Number.isInteger(amount);
    const isNotNegative = amount >= 0;
    const maximum = Shipment.getMaximum(this.source, this.target, resource);
    const fits = amount <= maximum;

    return isWhole && isNotNegative && fits;
  }

  private get amounts(): readonly [ResourceKey, number][] {
    return Object.entries(this.cargo).map(([resource, amount]) => [
      resource as ResourceKey,
      amount ?? 0,
    ]);
  }
}
