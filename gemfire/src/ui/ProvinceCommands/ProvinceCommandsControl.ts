import { ChangeLordCommand } from '@/core/commands/province/ChangeLordCommand';
import type { CommandGroup } from '@/core/commands/province/catalog';
import { DevelopCommand } from '@/core/commands/province/DevelopCommand';
import { GiveFoodCommand } from '@/core/commands/province/GiveFoodCommand';
import { HireMonsterCommand } from '@/core/commands/province/HireMonsterCommand';
import { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import { RecruitCommand } from '@/core/commands/province/RecruitCommand';
import { SearchCommand } from '@/core/commands/province/SearchCommand';
import { TradeCommand } from '@/core/commands/province/TradeCommand';
import { TransportCommand } from '@/core/commands/province/TransportCommand';
import { ViewCommand } from '@/core/commands/province/ViewCommand';
import type { WorldCommand } from '@/core/commands/WorldCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { Control } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';

import { ChangeLordDialogControl } from './CommandDialog/ChangeLordDialogControl';
import type { AnyCommandDialogControl } from './CommandDialog/CommandDialogControl';
import { DevelopDialogControl } from './CommandDialog/DevelopDialogControl';
import { GiveFoodDialogControl } from './CommandDialog/GiveFoodDialogControl';
import { MoveTroopsDialogControl } from './CommandDialog/MoveTroopsDialogControl';
import { RecruitDialogControl } from './CommandDialog/RecruitDialogControl';
import { SearchDialogControl } from './CommandDialog/SearchDialogControl';
import { TradeDialogControl } from './CommandDialog/TradeDialogControl';
import { TransportDialogControl } from './CommandDialog/TransportDialogControl';
import { CommandSelectedEvent } from './CommandSelectedEvent';
import { ProvinceCommandsView } from './ProvinceCommandsView';
import { TargetingEndedEvent } from './TargetingEndedEvent';
import { TargetingStartedEvent } from './TargetingStartedEvent';
import type { OverlayDialogs, ProvinceCommandsControls } from './types';

const TURN_END_DELAY_MS = 800;

interface PendingDialog {
  readonly command: WorldCommand;
  readonly dialog: AnyCommandDialogControl;
}

export class ProvinceCommandsControl extends Control<
  ProvinceCommandsView,
  ProvinceCommandsControls
> {
  private readonly dialogs = new Map<string, AnyCommandDialogControl>([
    [DevelopCommand.name, this.controls.developDialog],
    [GiveFoodCommand.name, this.controls.giveFoodDialog],
    [TradeCommand.name, this.controls.tradeDialog],
    [TransportCommand.name, this.controls.transportDialog],
    [RecruitCommand.name, this.controls.recruitDialog],
    [MoveTroopsCommand.name, this.controls.moveTroopsDialog],
    [ChangeLordCommand.name, this.controls.changeLordDialog],
    [SearchCommand.name, this.controls.searchDialog],
  ]);

  private pending: PendingDialog | null = null;

  public constructor(
    world: World,
    commands: readonly CommandGroup[],
    events: EventBus,
    overlayDialogs: OverlayDialogs,
  ) {
    super(
      ProvinceCommandsView,
      { world, commands, events },
      {
        developDialog: new DevelopDialogControl(DevelopCommand.name),
        giveFoodDialog: new GiveFoodDialogControl(GiveFoodCommand.name, world),
        tradeDialog: new TradeDialogControl(TradeCommand.name, world),
        transportDialog: new TransportDialogControl(
          TransportCommand.name,
          world,
        ),
        recruitDialog: new RecruitDialogControl(RecruitCommand.name, world),
        moveTroopsDialog: new MoveTroopsDialogControl(
          MoveTroopsCommand.name,
          world,
        ),
        changeLordDialog: new ChangeLordDialogControl(
          ChangeLordCommand.name,
          world,
        ),
        searchDialog: new SearchDialogControl(SearchCommand.name),
      },
    );

    this.dialogs.set(HireMonsterCommand.name, overlayDialogs.hireMonster);
    this.dialogs.set(ViewCommand.name, overlayDialogs.familyOverview);
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
          new TargetingStartedEvent(
            command.selectableTargets,
            dialog.inspectsTarget,
          ),
        );
      }
    } else {
      command.execute();

      if (command.consumesTurn()) {
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
    pending.command.execute();
    this.finishTurn();
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
