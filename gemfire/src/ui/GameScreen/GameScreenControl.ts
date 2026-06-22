import { HireMonsterCommand } from '@/core/commands/province/HireMonsterCommand';
import { ViewCommand } from '@/core/commands/province/ViewCommand';
import type { Province } from '@/core/domain/Province';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { Control } from '@/lib/Control';
import type { EventClass } from '@/lib/EventBus';
import { FamilyOverviewControl } from '@/ui/FamilyOverview/FamilyOverviewControl';
import { GamePanelControl } from '@/ui/GamePanel/GamePanelControl';
import { HireMonsterDialogControl } from '@/ui/ProvinceCommands/CommandDialog/HireMonsterDialogControl';
import { TargetingEndedEvent } from '@/ui/ProvinceCommands/TargetingEndedEvent';
import { TargetingStartedEvent } from '@/ui/ProvinceCommands/TargetingStartedEvent';
import { WorldMapControl } from '@/ui/WorldMap/WorldMapControl';

import { GameScreenView } from './GameScreenView';
import type { GameScreenContext, GameScreenControls } from './types';

export class GameScreenControl extends Control<
  GameScreenView,
  GameScreenControls
> {
  private selected?: number | undefined;
  private selectable?: Set<number> | undefined;
  private displayed?: number | undefined;
  private inspectsTarget = false;

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
      worldMap: new WorldMapControl({ map: context.world.map }),
      gamePanel: new GamePanelControl({
        world: context.world,
        commands: context.commands,
        events: context.events,
        overlayDialogs: { hireMonster, familyOverview },
      }),
      familyOverview,
      hireMonster,
    });
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
      if (this.displayed === event.province.number) {
        this.controls.gamePanel.actualizeProvince(event.province);
      }
    });
    this.onWorldEvent(TargetingStartedEvent, (event) =>
      this.startTargeting(event),
    );
    this.onWorldEvent(TargetingEndedEvent, () => this.endTargeting());

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

    if (province.belongsTo(this.context.world.player)) {
      this.view.showTurn(province, turnNumber);
      this.showProvince(province);
    }
  }

  private selectProvince(province: Province): void {
    if (this.selectable?.has(province.number)) {
      this.controls.gamePanel.pickTarget(province);

      if (this.inspectsTarget) {
        this.displayed = province.number;
        this.controls.gamePanel.showProvinceInfo(province);
      }

      this.renderTargeting(province.number);
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
