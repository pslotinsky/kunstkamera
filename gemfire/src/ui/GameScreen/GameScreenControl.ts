import type { Province } from '@/core/domain/Province';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { Control } from '@/lib/Control';
import type { EventClass } from '@/lib/EventBus';
import { GamePanelControl } from '@/ui/GamePanel/GamePanelControl';
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

  public constructor(context: GameScreenContext) {
    super(GameScreenView, context, {
      worldMap: new WorldMapControl({ map: context.world.map }),
      gamePanel: new GamePanelControl({
        world: context.world,
        commands: context.commands,
        events: context.events,
      }),
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
      if (this.selected === event.province.number) {
        this.controls.gamePanel.actualizeProvince(event.province);
      }
    });
    this.onWorldEvent(TargetingStartedEvent, (event) =>
      this.startTargeting(event.selectable),
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
      this.renderTargeting(province.number);
    }
  }

  private startTargeting(selectable: readonly number[]): void {
    this.selectable = new Set(selectable);
    this.renderTargeting();
  }

  private endTargeting(): void {
    this.selectable = undefined;
    this.showCurrentProvince();
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

    this.controls.worldMap.showCurrent(province);
    this.controls.gamePanel.showProvince(province);
  }
}
