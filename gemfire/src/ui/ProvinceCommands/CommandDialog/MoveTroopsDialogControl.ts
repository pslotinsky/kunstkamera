import type { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { CommandDialogControl } from './CommandDialogControl';
import { MoveTroopsDialogView } from './MoveTroopsDialogView';

const TROOP_CEILING = 999;

type Resource = 'troops' | 'food';

const RESOURCES: readonly Resource[] = ['troops', 'food'];

export class MoveTroopsDialogControl extends CommandDialogControl<
  MoveTroopsDialogView,
  MoveTroopsCommand,
  { troops: AmountFieldControl; food: AmountFieldControl }
> {
  private readonly world: World;
  private target: Province | undefined = undefined;

  public constructor(name: string, world: World) {
    super(
      MoveTroopsDialogView,
      { name },
      {
        troops: new AmountFieldControl({ name: 'troops' }),
        food: new AmountFieldControl({ name: 'food' }),
      },
    );
    this.world = world;
  }

  public override open(command: MoveTroopsCommand): void {
    this.target = undefined;
    this.controls.troops.reset();
    this.controls.food.reset();
    this.update();
    super.open(command);
  }

  public override pickTarget(province: Province): void {
    if (this.command?.selectableTargets.includes(province.number)) {
      this.target = province;
      this.update();
    }
  }

  protected override onMount(): void {
    for (const resource of RESOURCES) {
      this.controls[resource].onChange(() => this.update());
    }
  }

  protected override setupCommand(command: MoveTroopsCommand): void {
    if (this.target) {
      command.moveTo(
        this.target,
        this.controls.troops.value,
        this.controls.food.value,
      );
    }
  }

  private update(): void {
    this.view.showTarget(this.target);
    this.view.showAmounts(isDefined(this.target));

    for (const resource of RESOURCES) {
      const max = this.getMax(resource);

      this.controls[resource].setMax(max);
      this.view.setRange(resource, max);
    }

    this.view.enableConfirm(
      isDefined(this.target) &&
        this.controls.troops.value + this.controls.food.value > 0,
    );
  }

  private getMax(resource: Resource): number {
    const source = this.world.turnQueue.current;

    let max = 0;

    if (this.target && source) {
      max = Math.min(
        source.resources[resource],
        TROOP_CEILING - this.target.resources[resource],
      );
    }

    return max;
  }
}
