import type {
  TradeCommand,
  TradeDirection,
} from '@/core/commands/province/TradeCommand';
import type { MarketRateName } from '@/core/domain/MarketRate';
import type { World } from '@/core/domain/World';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { CommandDialogControl } from './CommandDialogControl';
import { CommandStep } from './CommandStep';
import { TradeDialogView } from './TradeDialogView';

const FOOD_CEILING = 999;

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
    return this.direction === undefined
      ? new CommandStep(FLAVOR[this.world.market.rate.name], DIRECTIONS)
      : undefined;
  }

  public override open(command: TradeCommand): void {
    this.direction = undefined;
    this.controls.amount.reset();
    this.update();
    super.open(command);
  }

  public override refresh(): void {
    this.update();
  }

  protected override onMount(): void {
    this.controls.amount.onChange(() => this.update());
  }

  protected override selectChoice(value: string): void {
    this.direction = value as TradeDirection;
    this.update();
  }

  protected override setupCommand(command: TradeCommand): void {
    command.direction = this.direction ?? 'buy';
    command.food = this.controls.amount.value;
  }

  private update(): void {
    this.view.showDirection(this.direction);
    this.controls.amount.setMax(this.max);
    this.view.setRange(this.direction, this.max);
    this.view.enableConfirm(this.controls.amount.value > 0);
  }

  private get max(): number {
    if (this.direction === undefined) {
      return 0;
    }

    const province = this.world.turnQueue.current;
    const { market } = this.world;
    const gold = province?.resources.gold ?? 0;
    const food = province?.resources.food ?? 0;

    return this.direction === 'sell'
      ? food
      : Math.min(market.toFood(gold), FOOD_CEILING - food);
  }
}
