import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { Province } from '@/core/domain/Province';
import { Control, type ControlRecord } from '@/lib/Control';

import { CancelClickedEvent } from './CancelClickedEvent';
import type { AnyCommandDialogView } from './CommandDialogView';
import { CommandStep } from './CommandStep';
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

  private hasTarget = false;
  private submitHandler: (() => void) | undefined = undefined;

  public get step(): CommandStep | undefined {
    const awaitsTarget =
      this.targetPrompt !== undefined &&
      (this.command?.requiresTarget ?? false) &&
      !this.hasTarget;

    return awaitsTarget ? new CommandStep(this.targetPrompt!) : undefined;
  }

  public get targetPrompt(): string | undefined {
    return undefined;
  }

  public get inspectsTarget(): boolean {
    return false;
  }

  public open(command: TCommand): void {
    this.command = command;
    this.hasTarget = false;
    this.reveal();
  }

  public chooseTarget(province: Province): void {
    this.hasTarget = true;
    this.pickTarget(province);
    this.reveal();
  }

  public chooseStep(value: string): void {
    this.selectChoice(value);
    this.reveal();
  }

  public refresh(): void {}

  public pickTarget(_province: Province): void {}

  public close(): void {
    this.view.hide();
  }

  public onConfirm(handler: () => void): void {
    this.submitHandler = handler;
    this.subscribe(ConfirmClickedEvent, () => this.submit());
  }

  public onCancel(handler: () => void): void {
    this.subscribe(CancelClickedEvent, handler);
  }

  protected selectChoice(_value: string): void {}

  protected setupCommand(_command: TCommand): void {}

  protected submit(): void {
    if (this.command && this.submitHandler) {
      this.setupCommand(this.command);
      this.submitHandler();
    }
  }

  private reveal(): void {
    if (this.step === undefined) {
      this.view.show();
    }
  }
}
