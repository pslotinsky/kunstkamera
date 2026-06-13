import { CultivationCommand } from '@/core/commands/province/CultivationCommand';
import type { CommandGroup } from '@/core/commands/province/catalog';
import { DevelopCommand } from '@/core/commands/province/DevelopCommand';
import { ProtectionCommand } from '@/core/commands/province/ProtectionCommand';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { World } from '@/core/domain/World';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { Control } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';

import { CancelClickedEvent } from './CommandDialog/CancelClickedEvent';
import type { CommandDialogControl } from './CommandDialog/CommandDialogControl';
import type { AnyCommandDialogView } from './CommandDialog/CommandDialogView';
import { ConfirmClickedEvent } from './CommandDialog/ConfirmClickedEvent';
import { ConfirmCommandDialogControl } from './CommandDialog/ConfirmCommandDialogControl';
import { CommandSelectedEvent } from './CommandSelectedEvent';
import { ProvinceCommandsView } from './ProvinceCommandsView';
import { TurnSkippedEvent } from './TurnSkippedEvent';
import type { ProvinceCommandsControls } from './types';

interface PendingDialog {
  readonly command: WorldCommand;
  readonly dialog: CommandDialogControl<AnyCommandDialogView>;
}

export class ProvinceCommandsControl extends Control<
  ProvinceCommandsView,
  ProvinceCommandsControls
> {
  private readonly dialogs = new Map<
    string,
    CommandDialogControl<AnyCommandDialogView>
  >([
    [CultivationCommand.name, this.controls.cultivationDialog],
    [ProtectionCommand.name, this.controls.protectionDialog],
  ]);

  private pending: PendingDialog | null = null;

  public constructor(
    world: World,
    commands: readonly CommandGroup[],
    events: EventBus,
  ) {
    super(
      ProvinceCommandsView,
      { world, commands, events },
      {
        cultivationDialog: new ConfirmCommandDialogControl(
          CultivationCommand.name,
          `Invest ${DevelopCommand.COST} gold for cultivation?`,
        ),
        protectionDialog: new ConfirmCommandDialogControl(
          ProtectionCommand.name,
          `Invest ${DevelopCommand.COST} gold for protection?`,
        ),
      },
    );
  }

  public show(): void {
    this.view.show();
  }

  public hide(): void {
    this.view.hide();
  }

  protected override onMount(): void {
    this.subscribe(CommandSelectedEvent, (event) =>
      this.selectCommand(event.command),
    );

    for (const dialog of this.dialogs.values()) {
      dialog.subscribe(ConfirmClickedEvent, () => this.confirmCommand());
      dialog.subscribe(CancelClickedEvent, () => this.closeDialog());
    }

    this.subscribe(TurnSkippedEvent, () => {
      const { world, events } = this.context;

      events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
    });
  }

  private selectCommand(command: WorldCommand): void {
    const alreadyOpen = this.pending?.command === command;

    this.closeDialog();

    if (!alreadyOpen) {
      this.runCommand(command);
    }
  }

  private runCommand(command: WorldCommand): void {
    const dialog = this.dialogs.get(command.constructor.name);

    if (dialog) {
      this.pending = { command, dialog };
      this.view.selectCommand(command.label);
      dialog.open();
    } else {
      command.execute();
    }
  }

  private confirmCommand(): void {
    const pending = this.pending;

    this.closeDialog();

    if (pending) {
      pending.command.execute();
      this.view.closeGroups();
      this.view.disableActions();
    }
  }

  private closeDialog(): void {
    if (this.pending) {
      this.view.deselectCommand(this.pending.command.label);
      this.pending.dialog.close();
      this.pending = null;
    }
  }
}
