import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { Province } from '@/core/domain/Province';
import { Control, type ControlRecord } from '@/lib/Control';

import { CancelClickedEvent } from './CancelClickedEvent';
import type { AnyCommandDialogView } from './CommandDialogView';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';

export type AnyCommandDialogControl = CommandDialogControl<
  AnyCommandDialogView,
  WorldCommand,
  ControlRecord
>;

export abstract class CommandDialogControl<
  TView extends AnyCommandDialogView,
  TCommand extends WorldCommand = WorldCommand,
  TControls extends ControlRecord = Record<string, never>,
> extends Control<TView, TControls> {
  protected command: TCommand | undefined = undefined;

  public open(command: TCommand): void {
    this.command = command;
    this.view.show();
  }

  public refresh(): void {}

  public pickTarget(_province: Province): void {}

  public get inspectsTarget(): boolean {
    return false;
  }

  public close(): void {
    this.view.hide();
  }

  public onConfirm(handler: () => void): void {
    this.subscribe(ConfirmClickedEvent, () => {
      if (this.command) {
        this.setupCommand(this.command);
        handler();
      }
    });
  }

  public onCancel(handler: () => void): void {
    this.subscribe(CancelClickedEvent, handler);
  }

  protected setupCommand(_command: TCommand): void {}
}
