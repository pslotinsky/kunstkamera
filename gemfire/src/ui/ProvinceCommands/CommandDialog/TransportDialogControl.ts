import type {
  TransportCommand,
  TransportDirection,
} from '@/core/commands/province/TransportCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { CommandDialogControl } from './CommandDialogControl';
import { CommandStep } from './CommandStep';
import {
  TransportDialogView,
  type TransportTarget,
} from './TransportDialogView';

const RESOURCE_CEILING = 999;

type Resource = 'gold' | 'food';

const RESOURCES: readonly Resource[] = ['gold', 'food'];

const DIRECTIONS: readonly { value: TransportDirection; label: string }[] = [
  { value: 'send', label: 'Send' },
  { value: 'receive', label: 'Receive' },
];

const QUESTIONS: Record<TransportDirection, string> = {
  send: 'Transport to where?',
  receive: 'Transport from where?',
};

export class TransportDialogControl extends CommandDialogControl<
  TransportDialogView,
  TransportCommand,
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

  public override get step(): CommandStep | undefined {
    if (this.direction && this.target) {
      return undefined;
    }

    return new CommandStep(
      this.direction ? QUESTIONS[this.direction] : 'Send or receive?',
      DIRECTIONS,
      this.direction,
    );
  }

  public override open(command: TransportCommand): void {
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
      source?.family &&
      province.belongsTo(source.family) &&
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
    for (const resource of RESOURCES) {
      this.controls[resource].onChange(() => this.update());
    }
  }

  protected override selectChoice(value: string): void {
    this.direction = value as TransportDirection;
    this.update();
  }

  protected override setupCommand(command: TransportCommand): void {
    if (this.target) {
      command.direction = this.direction ?? 'send';
      command.destination = this.target.number;
      command.gold = this.controls.gold.value;
      command.food = this.controls.food.value;
    }
  }

  private update(): void {
    this.view.showTarget(this.direction, this.target);

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
