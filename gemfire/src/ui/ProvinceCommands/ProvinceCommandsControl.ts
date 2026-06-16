import { CultivationCommand } from '@/core/commands/province/CultivationCommand';
import type { CommandGroup } from '@/core/commands/province/catalog';
import { DevelopCommand } from '@/core/commands/province/DevelopCommand';
import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import { ProtectionCommand } from '@/core/commands/province/ProtectionCommand';
import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { TransportCommand } from '@/core/commands/province/TransportCommand';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { Control } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';

import type { AnyCommandDialogControl } from './CommandDialog/CommandDialogControl';
import { ConfirmCommandDialogControl } from './CommandDialog/ConfirmCommandDialogControl';
import { GiveFoodDialogControl } from './CommandDialog/GiveFoodDialogControl';
import { TradeDialogControl } from './CommandDialog/TradeDialogControl';
import { TransportDialogControl } from './CommandDialog/TransportDialogControl';
import { CommandSelectedEvent } from './CommandSelectedEvent';
import { ProvinceCommandsView } from './ProvinceCommandsView';
import { TargetingEndedEvent } from './TargetingEndedEvent';
import { TargetingStartedEvent } from './TargetingStartedEvent';
import { TurnSkippedEvent } from './TurnSkippedEvent';
import type { ProvinceCommandsControls } from './types';

interface PendingDialog {
  readonly command: WorldCommand;
  readonly dialog: AnyCommandDialogControl;
}

export class ProvinceCommandsControl extends Control<
  ProvinceCommandsView,
  ProvinceCommandsControls
> {
  private readonly dialogs = new Map<string, AnyCommandDialogControl>([
    [CultivationCommand.name, this.controls.cultivationDialog],
    [ProtectionCommand.name, this.controls.protectionDialog],
    [GiveFoodCommand.name, this.controls.giveFoodDialog],
    [TradeCommand.name, this.controls.tradeDialog],
    [TransportCommand.name, this.controls.transportDialog],
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
        giveFoodDialog: new GiveFoodDialogControl(GiveFoodCommand.name, world),
        tradeDialog: new TradeDialogControl(TradeCommand.name, world),
        transportDialog: new TransportDialogControl(
          TransportCommand.name,
          world,
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

  public pickTarget(province: Province): void {
    this.pending?.dialog.pickTarget(province);
  }

  protected override onMount(): void {
    this.subscribe(CommandSelectedEvent, (event) =>
      this.selectCommand(event.command),
    );

    for (const dialog of this.dialogs.values()) {
      dialog.onConfirm(() => this.completeCommand());
      dialog.onCancel(() => this.closeDialog());
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
      dialog.open(command);

      if (command.requiresTarget) {
        this.context.events.publish(
          new TargetingStartedEvent(command.selectableTargets),
        );
      }
    } else {
      command.execute();
    }
  }

  private completeCommand(): void {
    const pending = this.pending;

    if (pending) {
      if (pending.command.consumesTurn()) {
        this.commitTurn(pending);
      } else {
        this.executeAndRefresh(pending);
      }
    }
  }

  private commitTurn(pending: PendingDialog): void {
    this.closeDialog();
    pending.command.execute();
    this.view.closeGroups();
    this.view.disableActions();
  }

  private executeAndRefresh(pending: PendingDialog): void {
    pending.command.execute();
    pending.dialog.refresh();
  }

  private closeDialog(): void {
    if (this.pending) {
      const { command } = this.pending;

      this.view.deselectCommand(command.label);
      this.pending.dialog.close();
      this.pending = null;

      if (command.requiresTarget) {
        this.context.events.publish(new TargetingEndedEvent());
      }
    }
  }
}
