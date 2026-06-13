import type { WorldCommand } from '@/core/commands/WorldCommand';
import { Control } from '@/lib/Control';

import type { AnyCommandDialogView } from './CommandDialogView';

export abstract class CommandDialogControl<
  TView extends AnyCommandDialogView,
> extends Control<TView> {
  protected command: WorldCommand | undefined = undefined;

  public open(command: WorldCommand): void {
    this.command = command;
    this.view.show();
  }

  public close(): void {
    this.view.hide();
  }
}
