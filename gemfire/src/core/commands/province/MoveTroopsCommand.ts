import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export class MoveTroopsCommand extends ProvinceCommand {
  private target: Province | undefined;
  private troops = 0;
  private food = 0;

  public constructor(context: WorldCommandContext) {
    super('Move Troops', context);
  }

  public moveTo(target: Province, troops: number, food: number): void {
    this.target = target;
    this.troops = troops;
    this.food = food;
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
    source.addResources({ troops: -this.troops, food: -this.food });
    target.addResources({ troops: this.troops, food: this.food });

    if (target.isNeutral()) {
      this.claim(target, owner);
    }

    this.publish(new ProvinceUpdatedEvent(target));
    this.complete(source);
  }

  private claim(target: Province, owner: Family): void {
    target.family = owner;
    target.assignGovernor(owner.ruler);
  }

  private canMove(source: Province, target: Province): boolean {
    const moved = this.troops > 0 || this.food > 0;
    const hasTroops = source.resources.troops >= this.troops;
    const hasFood = source.resources.food >= this.food;

    return (
      this.selectableTargets.includes(target.number) &&
      moved &&
      hasTroops &&
      hasFood
    );
  }
}
