import { HireMonsterCommand } from '@/core/commands/province/HireMonsterCommand';
import { ViewCommand } from '@/core/commands/province/ViewCommand';
import type { Province } from '@/core/domain/Province';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { WarReportedEvent } from '@/core/events/WarReportedEvent';
import { Control } from '@/lib/Control';
import type { EventClass } from '@/lib/EventBus';
import { AnnouncementsControl } from '@/ui/Announcements/AnnouncementsControl';
import { BattleReportControl } from '@/ui/BattleReport/BattleReportControl';
import { CaptiveDialogControl } from '@/ui/CaptiveDialog/CaptiveDialogControl';
import { DefenseDialogControl } from '@/ui/DefenseDialog/DefenseDialogControl';
import { FamilyOverviewControl } from '@/ui/FamilyOverview/FamilyOverviewControl';
import { GamePanelControl } from '@/ui/GamePanel/GamePanelControl';
import { HireMonsterDialogControl } from '@/ui/ProvinceCommands/CommandDialog/HireMonsterDialogControl';
import { TargetingEndedEvent } from '@/ui/ProvinceCommands/TargetingEndedEvent';
import { TargetingStartedEvent } from '@/ui/ProvinceCommands/TargetingStartedEvent';
import { SearchReportControl } from '@/ui/SearchReport/SearchReportControl';
import { TurnHold } from '@/ui/TurnHold';
import { WorldMapControl } from '@/ui/WorldMap/WorldMapControl';

import { GameScreenView } from './GameScreenView';
import type { GameScreenContext, GameScreenControls } from './types';

const COMPUTER_TURN_MS = 400;

export class GameScreenControl extends Control<
  GameScreenView,
  GameScreenControls
> {
  private selected?: number | undefined;
  private selectable?: Set<number> | undefined;
  private displayed?: number | undefined;
  private inspectsTarget = false;
  private readonly turnHold: TurnHold;

  public constructor(context: GameScreenContext) {
    const hireMonster = new HireMonsterDialogControl(
      HireMonsterCommand.name,
      context.world,
    );
    const familyOverview = new FamilyOverviewControl(
      ViewCommand.name,
      context.world,
    );

    super(GameScreenView, context, {
      worldMap: new WorldMapControl({
        map: context.world.map,
        sounds: context.sounds,
      }),
      gamePanel: new GamePanelControl({
        world: context.world,
        commands: context.commands,
        events: context.events,
        overlayDialogs: { hireMonster, familyOverview },
      }),
      familyOverview,
      hireMonster,
      searchReport: new SearchReportControl({ events: context.events }),
      battleReport: new BattleReportControl({
        world: context.world,
        events: context.events,
        sounds: context.sounds,
      }),
      captiveDialog: new CaptiveDialogControl({
        world: context.world,
        events: context.events,
      }),
      announcements: new AnnouncementsControl({
        world: context.world,
        events: context.events,
      }),
      defenseDialog: new DefenseDialogControl({
        world: context.world,
        events: context.events,
      }),
    });
    this.turnHold = new TurnHold(context.events);
  }

  protected override onMount(): void {
    this.controls.worldMap.onProvinceSelected((province) => {
      this.selectProvince(province);
    });
    this.onWorldEvent(MonthStartedEvent, (event) =>
      this.view.showDate(event.date),
    );
    this.onWorldEvent(TurnStartedEvent, (event) => this.handleTurnStart(event));
    this.onWorldEvent(ProvinceUpdatedEvent, (event) => {
      this.controls.worldMap.actualizeProvince(event.province);

      if (this.displayed === event.province.number) {
        this.controls.gamePanel.actualizeProvince(event.province);
      }
    });
    this.onWorldEvent(TargetingStartedEvent, (event) =>
      this.startTargeting(event),
    );
    this.onWorldEvent(TargetingEndedEvent, () => this.endTargeting());
    this.onWorldEvent(WarReportedEvent, (event) =>
      this.controls.worldMap.showWar(event.report, () =>
        this.controls.battleReport.showWar(event.report),
      ),
    );

    const current = this.context.world.turnQueue.current;

    if (current) {
      this.showProvince(current);
    }
  }

  private onWorldEvent<EventType extends object>(
    eventClass: EventClass<EventType>,
    handler: (event: EventType) => void,
  ): void {
    this.context.events.subscribe(eventClass, handler, this.signal);
  }

  private handleTurnStart(event: TurnStartedEvent): void {
    const { province, turnNumber } = event;

    const { world } = this.context;

    if (province.hasOwner()) {
      this.view.showTurn(province, turnNumber);
      this.showProvince(province);
    } else {
      this.controls.gamePanel.hideCommands();
    }

    if (world.isComputerRun(province)) {
      this.pauseComputerTurn();
    }
  }

  private pauseComputerTurn(): void {
    this.turnHold.hold();
    setTimeout(() => this.turnHold.release(), COMPUTER_TURN_MS);
  }

  private selectProvince(province: Province): void {
    if (this.selectable?.has(province.number)) {
      this.pickTarget(province);

      if (this.inspectsTarget) {
        this.displayed = province.number;
        this.controls.gamePanel.showProvinceInfo(province);
      }

      this.renderTargeting(province.number);
    }
  }

  private pickTarget(province: Province): void {
    if (this.controls.defenseDialog.isPicking) {
      this.controls.defenseDialog.pickRefuge(province);
    } else {
      this.controls.gamePanel.pickTarget(province);
    }
  }

  private startTargeting(event: TargetingStartedEvent): void {
    this.selectable = new Set(event.selectable);
    this.inspectsTarget = event.inspectsTarget;
    this.renderTargeting();
  }

  private endTargeting(): void {
    this.selectable = undefined;
    this.showCurrentProvince();

    if (this.inspectsTarget) {
      this.showCurrentInfo();
    }

    this.inspectsTarget = false;
  }

  private showCurrentInfo(): void {
    if (this.selected) {
      this.displayed = this.selected;
      this.controls.gamePanel.showProvinceInfo(
        this.context.world.map.getProvince(this.selected),
      );
    }
  }

  private renderTargeting(selected?: number): void {
    if (this.selectable) {
      this.showCurrentProvince();
      this.controls.worldMap.showSelectable([...this.selectable]);

      if (selected !== undefined) {
        this.controls.worldMap.showSelected(selected);
      }
    }
  }

  private showCurrentProvince(): void {
    if (this.selected === undefined) {
      this.controls.worldMap.clearHighlighting();
    } else {
      this.controls.worldMap.showCurrent(
        this.context.world.map.getProvince(this.selected),
      );
    }
  }

  private showProvince(province: Province): void {
    this.selected = province.number;
    this.displayed = province.number;

    this.controls.worldMap.showCurrent(province);
    this.controls.gamePanel.showProvince(province);
  }
}
