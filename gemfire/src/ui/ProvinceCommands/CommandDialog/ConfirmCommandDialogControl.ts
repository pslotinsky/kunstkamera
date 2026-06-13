import { CommandDialogControl } from './CommandDialogControl';
import { ConfirmCommandDialogView } from './ConfirmCommandDialogView';

export class ConfirmCommandDialogControl extends CommandDialogControl<ConfirmCommandDialogView> {
  public constructor(name: string, prompt: string) {
    super(ConfirmCommandDialogView, { name, prompt });
  }
}
