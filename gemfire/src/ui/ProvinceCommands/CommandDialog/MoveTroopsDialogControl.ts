import type { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { CommandDialogControl } from './CommandDialogControl';
import { MoveTroopsDialogView } from './MoveTroopsDialogView';

const RESOURCE_CEILING = 999;

type Resource = 'gold' | 'food' | 'troops';

const RESOURCES: readonly Resource[] = ['troops', 'food', 'gold'];

type AmountControls = Record<Resource, AmountFieldControl>;

export class MoveTroopsDialogControl extends CommandDialogControl<
  MoveTroopsDialogView,
  MoveTroopsCommand,
  AmountControls
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
        gold: new AmountFieldControl({ name: 'gold' }),
      },
    );
    this.world = world;
  }

  public override open(command: MoveTroopsCommand): void {
    this.target = undefined;

    for (const resource of RESOURCES) {
      this.controls[resource].reset();
    }

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
      command.moveTo(this.target, {
        gold: this.controls.gold.value,
        food: this.controls.food.value,
        troops: this.controls.troops.value,
      });
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

    this.view.enableConfirm(isDefined(this.target) && this.committed() > 0);
  }

  private committed(): number {
    return RESOURCES.reduce(
      (total, resource) => total + this.controls[resource].value,
      0,
    );
  }

  private getMax(resource: Resource): number {
    const source = this.world.turnQueue.current;

    let max = 0;

    if (this.target && source) {
      max = Math.min(
        source.resources[resource],
        RESOURCE_CEILING - this.target.resources[resource],
      );
    }

    return max;
  }
}
