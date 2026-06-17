import {
  TransportCommand,
  type TransportDirection,
} from '@/core/commands/province/TransportCommand';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { CommandDialogControl } from './CommandDialogControl';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';
import { DirectionSelectedEvent } from './DirectionSelectedEvent';
import {
  TransportDialogView,
  type TransportTarget,
} from './TransportDialogView';

const RESOURCE_CEILING = 999;

type Resource = 'gold' | 'food';

const RESOURCES: readonly Resource[] = ['gold', 'food'];

export class TransportDialogControl extends CommandDialogControl<
  TransportDialogView,
  { gold: AmountFieldControl; food: AmountFieldControl }
> {
  private readonly world: World;
  private direction: TransportDirection | undefined = undefined;
  private target: TransportTarget | undefined = undefined;

  public constructor(name: string, world: World) {
    super(
      TransportDialogView,
      { name },
      {
        gold: new AmountFieldControl({ name: 'gold' }),
        food: new AmountFieldControl({ name: 'food' }),
      },
    );
    this.world = world;
  }

  public override open(command: WorldCommand): void {
    this.direction = undefined;
    this.target = undefined;
    this.controls.gold.reset();
    this.controls.food.reset();
    this.update();
    super.open(command);
  }

  public override pickTarget(province: Province): void {
    const source = this.world.turnQueue.current;

    if (
      source?.owner &&
      province.isBelongsTo(source.owner) &&
      !province.isEqual(source)
    ) {
      this.target = {
        number: province.number,
        name: province.name,
        gold: province.resources.gold,
        food: province.resources.food,
      };
      this.update();
    }
  }

  protected override onMount(): void {
    this.subscribe(DirectionSelectedEvent, (event) => {
      this.direction = event.direction as TransportDirection;
      this.update();
    });

    for (const resource of RESOURCES) {
      this.controls[resource].onChange(() => this.update());
    }

    this.subscribe(ConfirmClickedEvent, () => {
      if (this.command instanceof TransportCommand && this.target) {
        this.command.direction = this.direction ?? 'send';
        this.command.destination = this.target.number;
        this.command.gold = this.controls.gold.value;
        this.command.food = this.controls.food.value;
      }
    });
  }

  private update(): void {
    this.view.showDirection(this.direction);
    this.view.showTarget(this.direction, this.target);
    this.view.showAmounts(this.target !== undefined);

    for (const resource of RESOURCES) {
      const max = this.getMax(resource);

      this.controls[resource].setMax(max);
      this.view.setRange(resource, max);
    }

    this.view.enableConfirm(
      this.target !== undefined &&
        this.controls.gold.value + this.controls.food.value > 0,
    );
  }

  private getMax(resource: Resource): number {
    const current = this.world.turnQueue.current;

    if (!this.target || !this.direction || !current) {
      return 0;
    }

    const balance = current.resources[resource];
    const onTarget = this.target[resource];

    return this.direction === 'send'
      ? Math.min(balance, RESOURCE_CEILING - onTarget)
      : Math.min(onTarget, RESOURCE_CEILING - balance);
  }
}
