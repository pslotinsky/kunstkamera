import { TradeCommand } from '@/core/commands/province/TradeCommand';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { World } from '@/core/domain/World';

import { CommandDialogControl } from './CommandDialogControl';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';
import { TradeDialogView } from './TradeDialogView';

const FOOD_CEILING = 999;

export class TradeDialogControl extends CommandDialogControl<TradeDialogView> {
  private readonly world: World;

  public constructor(name: string, world: World) {
    super(TradeDialogView, { name });
    this.world = world;
  }

  public override open(command: WorldCommand): void {
    this.view.reset();
    this.applyLimits();
    super.open(command);
  }

  public override refresh(): void {
    this.applyLimits();
  }

  protected override onMount(): void {
    this.subscribe(ConfirmClickedEvent, () => {
      if (this.command instanceof TradeCommand) {
        this.command.direction = this.view.direction;
        this.command.food = this.view.amount;
      }
    });
  }

  private applyLimits(): void {
    const province = this.world.turnQueue.current;
    const { market } = this.world;
    const gold = province?.resources.gold ?? 0;
    const food = province?.resources.food ?? 0;

    this.view.setLimits({
      rate: market.rate.name,
      buyMax: Math.min(market.toFood(gold), FOOD_CEILING - food),
      sellMax: food,
    });
  }
}
