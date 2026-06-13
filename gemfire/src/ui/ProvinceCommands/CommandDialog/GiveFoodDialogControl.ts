import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { World } from '@/core/domain/World';

import { CommandDialogControl } from './CommandDialogControl';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';
import { GiveFoodDialogView } from './GiveFoodDialogView';

export class GiveFoodDialogControl extends CommandDialogControl<GiveFoodDialogView> {
  private readonly world: World;

  public constructor(name: string, world: World) {
    super(GiveFoodDialogView, { name });
    this.world = world;
  }

  public override open(command: WorldCommand): void {
    const province = this.world.turnQueue.current;

    this.view.setStock(province?.resources.food ?? 0);
    super.open(command);
  }

  protected override onMount(): void {
    this.subscribe(ConfirmClickedEvent, () => {
      if (this.command instanceof GiveFoodCommand) {
        this.command.food = this.view.amount;
      }
    });
  }
}
