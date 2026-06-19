import type {
  TradeCommand,
  TradeDirection,
} from '@/core/commands/province/TradeCommand';
import type { World } from '@/core/domain/World';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { CommandDialogControl } from './CommandDialogControl';
import { DirectionSelectedEvent } from './DirectionSelectedEvent';
import { TradeDialogView } from './TradeDialogView';

const FOOD_CEILING = 999;

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
    this.subscribe(DirectionSelectedEvent, (event) => {
      this.direction = event.direction as TradeDirection;
      this.update();
    });

    this.controls.amount.onChange(() => this.update());
  }

  protected override setupCommand(command: TradeCommand): void {
    command.direction = this.direction ?? 'buy';
    command.food = this.controls.amount.value;
  }

  private update(): void {
    this.view.showFlavor(this.world.market.rate.name);
    this.view.showDirection(this.direction);
    this.view.showAmounts(this.direction !== undefined);
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
