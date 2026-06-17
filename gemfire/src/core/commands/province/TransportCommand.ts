import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

export type TransportDirection = 'send' | 'receive';

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

  public execute(): void {
    if (
      this.source &&
      this.target &&
      this.canTransport(this.source, this.target)
    ) {
      this.source.addResources({ gold: -this.gold, food: -this.food });
      this.target.addResources({ gold: this.gold, food: this.food });

      this.publish(new ProvinceUpdatedEvent(this.other!));
      this.complete(this.currentProvince!);
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

  private canTransport(source: Province, target: Province): boolean {
    const isValueSelected = this.gold > 0 || this.food > 0;
    const hasEnoughGold = source.resources.gold >= this.gold;
    const hasEnoughFood = source.resources.food >= this.food;

    return (
      this.isValidSelection(source, target) &&
      isValueSelected &&
      hasEnoughGold &&
      hasEnoughFood
    );
  }

  private isValidSelection(source: Province, target: Province): boolean {
    return (
      source.hasOwner() &&
      target.isBelongsTo(source.owner!) &&
      !source.isEqual(target)
    );
  }
}
