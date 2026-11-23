import type { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';

import { CommandDialogControl } from './CommandDialogControl';
import { FoodAmountChosenEvent } from './FoodAmountChosenEvent';
import { GiveFoodDialogView } from './GiveFoodDialogView';

export class GiveFoodDialogControl extends CommandDialogControl<
  GiveFoodDialogView,
  GiveFoodCommand
> {
  private amount = 0;

  public constructor(name: string) {
    super(GiveFoodDialogView, { name });
  }

  public override open(command: GiveFoodCommand): void {
    this.amount = 0;
    this.view.showAmounts(command.foodStock);
    super.open(command);
  }

  protected override onMount(): void {
    this.subscribe(FoodAmountChosenEvent, (event) =>
      this.chooseAmount(event.amount),
    );
  }

  protected override setupCommand(command: GiveFoodCommand): void {
    command.food = this.amount;
  }

  private chooseAmount(amount: number): void {
    if (this.command?.canGive(amount)) {
      this.amount = amount;

      if (this.command.trainsCharisma) {
        this.view.showTrainingConfirmation(amount);
      } else {
        this.submit();
      }
    }
  }
}
