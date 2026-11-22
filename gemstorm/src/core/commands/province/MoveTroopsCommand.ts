import type { Family } from '@/core/domain/Family';
import type { FifthUnit } from '@/core/domain/FifthUnit';
import type { Province } from '@/core/domain/Province';
import type { ResourceGains, ResourceKey } from '@/core/domain/Resources';
import { Shipment } from '@/core/domain/Shipment';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class MoveTroopsCommand extends ProvinceCommand {
  private target: Province | undefined;
  private cargo: ResourceGains = {};
  private carried: FifthUnit | undefined;

  public constructor(context: WorldCommandContext) {
    super('Move Troops', context);
  }

  public moveTo(target: Province, cargo: ResourceGains): void {
    this.target = target;
    this.cargo = cargo;
  }

  public carry(unit: FifthUnit | undefined): void {
    this.carried = unit;
  }

  public getMaximum(resource: ResourceKey): number {
    const source = this.currentProvince;
    const { target } = this;

    return isDefined(source) && isDefined(target)
      ? Shipment.getMaximum(source, target, resource)
      : 0;
  }

  public override canExecute(): boolean {
    return this.requiresTarget;
  }

  public override get selectableTargets(): readonly number[] {
    const source = this.currentProvince;
    const { world } = this.context;

    return source
      ? world.map.provinces
          .filter(
            (province) =>
              source.hasOwner() &&
              source.isNeighbor(province) &&
              (province.isNeutral() || province.belongsTo(source.family!)),
          )
          .map((province) => province.number)
      : [];
  }

  public execute(): void {
    const source = this.currentProvince;
    const { target } = this;

    if (isDefined(source?.family) && isDefined(target)) {
      const shipment = new Shipment({ source, target, cargo: this.cargo });

      if (this.canMove(shipment)) {
        this.march(shipment, source.family);
      }
    }
  }

  private march(shipment: Shipment, owner: Family): void {
    const { source, target } = shipment;

    shipment.deliver();

    if (isDefined(this.carried)) {
      source.fifthUnits.transfer(this.carried, target.fifthUnits);
    }
    target.claimUnowned(owner);

    this.publish(new ProvinceUpdatedEvent(target));
    this.complete(source);
  }

  private canMove(shipment: Shipment): boolean {
    const { source, target } = shipment;
    const isCarrying = this.isCarrying(source);
    const canStation = !isCarrying || target.fifthUnits.canStation;

    return (
      this.selectableTargets.includes(target.number) &&
      (!shipment.isEmpty || isCarrying) &&
      shipment.isDeliverable &&
      canStation
    );
  }

  private isCarrying(source: Province): boolean {
    const { carried } = this;

    return isDefined(carried) && source.fifthUnits.hasUnit(carried);
  }
}
