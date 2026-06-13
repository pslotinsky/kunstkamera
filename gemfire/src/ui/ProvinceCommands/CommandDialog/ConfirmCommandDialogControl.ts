import { CommandDialogControl } from './CommandDialogControl';
import { ConfirmCommandDialogView } from './ConfirmCommandDialogView';

export class ConfirmCommandDialogControl extends CommandDialogControl<ConfirmCommandDialogView> {
  public constructor(prompt: string) {
    super(ConfirmCommandDialogView, { prompt });
  }
}
