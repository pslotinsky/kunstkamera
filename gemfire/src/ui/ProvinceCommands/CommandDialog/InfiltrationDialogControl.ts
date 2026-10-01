import type { InfiltrationCommand } from '@/core/commands/province/InfiltrationCommand';
import type { Province } from '@/core/domain/Province';
import { isDefined } from '@/lib/value/isDefined';

import { CommandDialogControl } from './CommandDialogControl';
import {
  type InfiltrationDialogContext,
  InfiltrationDialogView,
} from './InfiltrationDialogView';

export class InfiltrationDialogControl extends CommandDialogControl<
  InfiltrationDialogView,
  InfiltrationCommand
> {
  private target: Province | undefined = undefined;

  public constructor(context: InfiltrationDialogContext) {
    super(InfiltrationDialogView, context);
  }

  public override open(command: InfiltrationCommand): void {
    this.target = undefined;
    this.update();
    super.open(command);
  }

  public override pickTarget(province: Province): void {
    if (this.command?.selectableTargets.includes(province.number)) {
      this.target = province;
      this.update();
    }
  }

  protected override setupCommand(command: InfiltrationCommand): void {
    if (this.target) {
      command.aimAt(this.target);
    }
  }

  private update(): void {
    this.view.showTarget(this.target);
    this.view.enableConfirm(isDefined(this.target));
  }
}
