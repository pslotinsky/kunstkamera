import type {
  EntrustCommand,
  EntrustMode,
} from '@/core/commands/province/EntrustCommand';
import type { Province } from '@/core/domain/Province';

import { CommandDialogControl } from './CommandDialogControl';
import { EntrustDialogView } from './EntrustDialogView';
import { EntrustModeSelectedEvent } from './EntrustModeSelectedEvent';

export class EntrustDialogControl extends CommandDialogControl<
  EntrustDialogView,
  EntrustCommand
> {
  private target: Province | undefined = undefined;
  private mode: EntrustMode = 'entrust';

  public constructor(name: string) {
    super(EntrustDialogView, { name });
  }

  public override open(command: EntrustCommand): void {
    this.target = undefined;
    this.update();
    super.open(command);
  }

  public override pickTarget(province: Province): void {
    this.target = province;
    this.mode = province.isEntrusted ? 'cancel' : 'entrust';
    this.update();
  }

  public override refresh(): void {
    if (this.target) {
      this.pickTarget(this.target);
    }
  }

  protected override onMount(): void {
    this.subscribe(EntrustModeSelectedEvent, (event) => {
      this.mode = event.mode;
      this.update();
    });
  }

  protected override setupCommand(command: EntrustCommand): void {
    if (this.target && this.mode === 'entrust') {
      command.entrust(this.target);
    } else if (this.target) {
      command.cancel(this.target);
    }
  }

  private update(): void {
    this.view.showTarget(this.target);

    if (this.target) {
      this.view.showMode(this.mode, this.target.isEntrusted);
    }
  }
}
