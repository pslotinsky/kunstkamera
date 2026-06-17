import {
  DevelopCommand,
  type DevelopTarget,
} from '@/core/commands/province/DevelopCommand';
import type { WorldCommand } from '@/core/commands/WorldCommand';

import { CommandDialogControl } from './CommandDialogControl';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';
import { DevelopDialogView } from './DevelopDialogView';
import { DevelopTargetSelectedEvent } from './DevelopTargetSelectedEvent';

export class DevelopDialogControl extends CommandDialogControl<DevelopDialogView> {
  private target: DevelopTarget | undefined = undefined;

  public constructor(name: string) {
    super(DevelopDialogView, { name });
  }

  public override open(command: WorldCommand): void {
    this.target = undefined;
    this.update();
    super.open(command);
  }

  protected override onMount(): void {
    this.subscribe(DevelopTargetSelectedEvent, (event) => {
      this.target = event.target as DevelopTarget;
      this.update();
    });

    this.subscribe(ConfirmClickedEvent, () => {
      if (this.command instanceof DevelopCommand && this.target) {
        this.command.target = this.target;
      }
    });
  }

  private update(): void {
    this.view.showTarget(this.target);
  }
}
