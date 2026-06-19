import type {
  DevelopCommand,
  DevelopTarget,
} from '@/core/commands/province/DevelopCommand';

import { CommandDialogControl } from './CommandDialogControl';
import { DevelopDialogView } from './DevelopDialogView';
import { DevelopTargetSelectedEvent } from './DevelopTargetSelectedEvent';

export class DevelopDialogControl extends CommandDialogControl<
  DevelopDialogView,
  DevelopCommand
> {
  private target: DevelopTarget | undefined = undefined;

  public constructor(name: string) {
    super(DevelopDialogView, { name });
  }

  public override open(command: DevelopCommand): void {
    this.target = undefined;
    this.update();
    super.open(command);
  }

  protected override onMount(): void {
    this.subscribe(DevelopTargetSelectedEvent, (event) => {
      this.target = event.target as DevelopTarget;
      this.update();
    });
  }

  protected override setupCommand(command: DevelopCommand): void {
    if (this.target) {
      command.target = this.target;
    }
  }

  private update(): void {
    this.view.showTarget(this.target);
  }
}
