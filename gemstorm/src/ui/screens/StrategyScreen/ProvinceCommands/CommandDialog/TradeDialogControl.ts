import type {
  TradeCommand,
  TradeDirection,
} from '@/core/commands/province/TradeCommand';
import type { MarketRateName } from '@/core/domain/MarketRate';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { CommandDialogControl } from './CommandDialogControl';
import { CommandStep } from './CommandStep';
import { TradeDialogView } from './TradeDialogView';

const DIRECTIONS: readonly { value: TradeDirection; label: string }[] = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
];

const FLAVOR: Record<MarketRateName, string> = {
  low: 'The prices are low.',
  average: 'The prices are average.',
  high: 'The prices are high.',
};

export class TradeDialogControl extends CommandDialogControl<
  TradeDialogView,
  TradeCommand,
  { amount: AmountFieldControl }
> {
  private readonly world: World;
  private direction: TradeDirection | undefined = undefined;

  public constructor(name: string, world: World) {
    super(
      TradeDialogView,
      { name },
      {
        amount: new AmountFieldControl({ name: 'amount' }),
      },
    );
    this.world = world;
  }

  public override get step(): CommandStep | undefined {
    const prompt = FLAVOR[this.world.market.rate.name];

    return isDefined(this.direction)
      ? undefined
      : new CommandStep(prompt, DIRECTIONS);
  }

  public override open(command: TradeCommand): void {
    this.direction = undefined;
    this.controls.amount.reset();
    super.open(command);
    this.update();
  }

  public override refresh(): void {
    this.update();
  }

  protected override onMount(): void {
    this.controls.amount.onChange(() => this.update());
  }

  protected override selectChoice(value: string): void {
    const choice = DIRECTIONS.find((direction) => direction.value === value);

    if (isDefined(choice)) {
      this.direction = choice.value;
      this.update();
    }
  }

  protected override setupCommand(command: TradeCommand): void {
    command.direction = this.direction ?? 'buy';
    command.amount = this.controls.amount.value;
  }

  private update(): void {
    const { direction, command } = this;
    const amount = this.controls.amount;
    const hasTrade = isDefined(direction) && isDefined(command);
    const minimum = hasTrade ? command.getMinimumAmount(direction) : 0;
    const maximum = hasTrade ? command.getMaximumAmount(direction) : 0;

    this.view.showDirection(direction);
    amount.setMax(maximum);
    this.view.setRange(direction, minimum, maximum);

    const canConfirm = hasTrade && command.canTrade(direction, amount.value);

    this.view.enableConfirm(canConfirm);
  }
}
