import type { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import type { World } from '@/core/domain/World';

import { CommandDialogControl } from './CommandDialogControl';
import { GiveFoodDialogView } from './GiveFoodDialogView';

export class GiveFoodDialogControl extends CommandDialogControl<
  GiveFoodDialogView,
  GiveFoodCommand
> {
  private readonly world: World;

  public constructor(name: string, world: World) {
    super(GiveFoodDialogView, { name });
    this.world = world;
  }

  public override open(command: GiveFoodCommand): void {
    const province = this.world.turnQueue.current;

    this.view.setStock(province?.resources.food ?? 0);
    super.open(command);
  }

  protected override setupCommand(command: GiveFoodCommand): void {
    command.food = this.view.amount;
  }
}
