import { CommandExecutor } from '@/core/CommandExecutor';
import type { CommandGroup } from '@/core/commands/province/catalog';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { CampaignEndedEvent } from '@/core/events/CampaignEndedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { Control } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import type { CommandDialogsControl } from '@/ui/CommandDialogs/CommandDialogsControl';

import type { AnyCommandDialogControl } from './CommandDialog/CommandDialogControl';
import { CommandSelectedEvent } from './CommandSelectedEvent';
import { ProvinceCommandsView } from './ProvinceCommandsView';
import { StepChosenEvent } from './StepChosenEvent';
import { TargetingEndedEvent } from './TargetingEndedEvent';
import { TargetingStartedEvent } from './TargetingStartedEvent';

const TURN_END_DELAY_MS = 800;

interface PendingDialog {
  readonly command: WorldCommand;
  readonly dialog: AnyCommandDialogControl;
}

export class ProvinceCommandsControl extends Control<ProvinceCommandsView> {
  private readonly executor: CommandExecutor;
  private readonly dialogs: CommandDialogsControl;

  private pending: PendingDialog | null = null;

  public constructor(
    world: World,
    commands: readonly CommandGroup[],
    events: EventBus,
    dialogs: CommandDialogsControl,
  ) {
    super(ProvinceCommandsView, { world, commands, events });
    this.executor = new CommandExecutor({ world, events });
    this.dialogs = dialogs;
  }

  public show(): void {
    this.view.show();
  }

  public hide(): void {
    this.view.hide();
  }

  public pickTarget(province: Province): void {
    if (this.pending) {
      this.pending.dialog.chooseTarget(province);
      this.showStep();
    }
  }

  protected override onMount(): void {
    this.context.events.subscribe(
      CampaignEndedEvent,
      () => {
        this.closeDialog();
        this.view.disableActions();
        this.hide();
      },
      this.signal,
    );
    this.subscribe(CommandSelectedEvent, (event) =>
      this.selectCommand(event.command),
    );
    this.subscribe(StepChosenEvent, (event) => this.chooseStep(event.value));

    for (const dialog of this.dialogs.all) {
      dialog.onConfirm(() => this.completeCommand());
      dialog.onCancel(() => this.closeDialog());
    }
  }

  private chooseStep(value: string): void {
    this.pending?.dialog.chooseStep(value);
    this.showStep();
  }

  private showStep(): void {
    this.view.showStep(this.pending?.dialog.step);
  }

  private selectCommand(command: WorldCommand): void {
    const alreadyOpen = this.pending?.command === command;

    this.closeDialog();

    if (!alreadyOpen && !this.context.world.campaign.isEnded) {
      this.runCommand(command);
    }
  }

  private runCommand(command: WorldCommand): void {
    const dialog = this.dialogs.findDialog(command);

    if (dialog) {
      this.pending = { command, dialog };
      this.view.selectCommand(command.label);
      dialog.open(command);
      this.showStep();

      if (command.requiresTarget) {
        this.context.events.publish(
          new TargetingStartedEvent(
            command.selectableTargets,
            dialog.inspectsTarget,
          ),
        );
      }
    } else {
      this.executor.execute(command);

      if (command.consumesTurn() && !command.suspendsTurn()) {
        this.finishTurn();
      }
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
    this.executor.execute(pending.command);

    if (pending.command.suspendsTurn()) {
      this.holdTurn();
    } else {
      this.finishTurn();
    }
  }

  private holdTurn(): void {
    this.view.closeGroups();
    this.view.disableActions();
  }

  private finishTurn(): void {
    this.view.closeGroups();
    this.view.disableActions();

    const { world, events } = this.context;

    setTimeout(
      () => events.publish(new TurnEndedEvent(world.turnQueue.turnNumber)),
      TURN_END_DELAY_MS,
    );
  }

  private executeAndRefresh(pending: PendingDialog): void {
    this.executor.execute(pending.command);
    pending.dialog.refresh();
  }

  private closeDialog(): void {
    if (this.pending) {
      const { command } = this.pending;

      this.view.deselectCommand(command.label);
      this.view.showStep(undefined);
      this.pending.dialog.close();
      this.pending = null;

      if (command.requiresTarget) {
        this.context.events.publish(new TargetingEndedEvent());
      }
    }
  }
}
