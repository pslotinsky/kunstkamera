import type { Province } from '@/core/domain/Province';
import type { ResourceKey } from '@/core/domain/Resources';
import { Shipment } from '@/core/domain/Shipment';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export type TransportDirection = 'send' | 'receive';

export type TransportedResource = Exclude<ResourceKey, 'troops'>;

export class TransportCommand extends ProvinceCommand {
  public direction: TransportDirection = 'send';
  public destination: number | undefined = undefined;
  public gold = 0;
  public food = 0;

  public constructor(context: WorldCommandContext) {
    super('Transport', context);
  }

  public override canExecute(): boolean {
    return this.requiresTarget;
  }

  public override get selectableTargets(): readonly number[] {
    const current = this.currentProvince;
    const { map } = this.context.world;

    return current
      ? map.provinces
          .filter((province) => this.isValidSelection(current, province))
          .map((province) => province.number)
      : [];
  }

  public getMaximum(resource: TransportedResource): number {
    const { source, target } = this;

    return isDefined(source) && isDefined(target)
      ? Shipment.getMaximum(source, target, resource)
      : 0;
  }

  public execute(): void {
    const { source, target } = this;

    if (isDefined(source) && isDefined(target)) {
      const shipment = new Shipment({
        source,
        target,
        cargo: { gold: this.gold, food: this.food },
      });

      if (this.canTransport(shipment)) {
        shipment.deliver();
        this.publish(new ProvinceUpdatedEvent(this.other!));
        this.complete(this.currentProvince!);
      }
    }
  }

  private get source(): Province | undefined {
    return this.direction === 'send' ? this.currentProvince : this.other;
  }

  private get target(): Province | undefined {
    return this.direction === 'send' ? this.other : this.currentProvince;
  }

  private get other(): Province | undefined {
    const { map } = this.context.world;

    return this.destination ? map.getProvince(this.destination) : undefined;
  }

  private canTransport(shipment: Shipment): boolean {
    return (
      this.isValidSelection(shipment.source, shipment.target) &&
      !shipment.isEmpty &&
      shipment.isDeliverable
    );
  }

  private isValidSelection(source: Province, target: Province): boolean {
    return (
      source.hasOwner() &&
      target.belongsTo(source.family!) &&
      !source.isEqual(target)
    );
  }
}
