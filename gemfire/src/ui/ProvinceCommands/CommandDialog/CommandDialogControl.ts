import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { Province } from '@/core/domain/Province';
import { Control, type ControlRecord } from '@/lib/Control';

import { CancelClickedEvent } from './CancelClickedEvent';
import type { AnyCommandDialogView } from './CommandDialogView';
import { ConfirmClickedEvent } from './ConfirmClickedEvent';

export type AnyCommandDialogControl = CommandDialogControl<
  AnyCommandDialogView,
  ControlRecord
>;

export abstract class CommandDialogControl<
  TView extends AnyCommandDialogView,
  TControls extends ControlRecord = Record<string, never>,
> extends Control<TView, TControls> {
  protected command: WorldCommand | undefined = undefined;

  public open(command: WorldCommand): void {
    this.command = command;
    this.view.show();
  }

  public refresh(): void {}

  public pickTarget(_province: Province): void {}

  public close(): void {
    this.view.hide();
  }

  public onConfirm(handler: () => void): void {
    this.subscribe(ConfirmClickedEvent, handler);
  }

  public onCancel(handler: () => void): void {
    this.subscribe(CancelClickedEvent, handler);
  }
}
