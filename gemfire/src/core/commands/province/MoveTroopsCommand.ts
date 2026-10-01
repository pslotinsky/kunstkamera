import type { Family } from '@/core/domain/Family';
import type { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';
import type { ResourceGains } from '@/core/domain/Resources';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class MoveTroopsCommand extends ProvinceCommand {
  private target: Province | undefined;
  private gold = 0;
  private food = 0;
  private troops = 0;
  private carried: HiredUnit | undefined;

  public constructor(context: WorldCommandContext) {
    super('Move Troops', context);
  }

  public moveTo(target: Province, cargo: ResourceGains): void {
    this.target = target;
    this.gold = cargo.gold ?? 0;
    this.food = cargo.food ?? 0;
    this.troops = cargo.troops ?? 0;
  }

  public carry(unit: HiredUnit | undefined): void {
    this.carried = unit;
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

    if (source?.family && this.target && this.canMove(source, this.target)) {
      this.march(source, source.family, this.target);
    }
  }

  private march(source: Province, owner: Family, target: Province): void {
    source.addResources({
      gold: -this.gold,
      food: -this.food,
      troops: -this.troops,
    });
    target.addResources({
      gold: this.gold,
      food: this.food,
      troops: this.troops,
    });

    if (target.isNeutral()) {
      this.claim(target, owner);
    }

    this.relocateUnit(source, target);

    this.publish(new ProvinceUpdatedEvent(target));
    this.complete(source);
  }

  private relocateUnit(source: Province, target: Province): void {
    if (this.isCarrying(source)) {
      source.removeUnit(this.carried!);
      target.addUnit(this.carried!);
    }
  }

  private claim(target: Province, owner: Family): void {
    target.claim(owner);
    target.assignGovernor(owner.ruler);
  }

  private canMove(source: Province, target: Province): boolean {
    const moved =
      this.gold > 0 ||
      this.food > 0 ||
      this.troops > 0 ||
      this.isCarrying(source);
    const affordable =
      source.resources.gold >= this.gold &&
      source.resources.food >= this.food &&
      source.resources.troops >= this.troops;

    return (
      this.selectableTargets.includes(target.number) && moved && affordable
    );
  }

  private isCarrying(source: Province): boolean {
    return (
      this.carried !== undefined && source.hiredUnits.includes(this.carried)
    );
  }
}
