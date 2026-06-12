import type { Province } from '@/core/domain/Province';
import { MonthStartedEvent } from '@/core/events/MonthStartedEvent';
import { TurnStartedEvent } from '@/core/events/TurnStartedEvent';
import { Control } from '@/lib/Control';
import { GamePanelControl } from '@/ui/GamePanel/GamePanelControl';
import { ProvinceSelectedEvent } from '@/ui/WorldMap/ProvinceSelectedEvent';
import { WorldMapControl } from '@/ui/WorldMap/WorldMapControl';

import { GameScreenView } from './GameScreenView';
import type { GameScreenContext, GameScreenControls } from './types';

export class GameScreenControl extends Control<
  GameScreenView,
  GameScreenControls
> {
  private selected?: number | undefined;

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
    this.controls.worldMap.subscribe(ProvinceSelectedEvent, (event) => {
      this.selectProvince(event.provinceNumber);
    });
    this.context.events.subscribe(MonthStartedEvent, (event) => {
      this.view.showDate(event.date);
    });
    this.context.events.subscribe(TurnStartedEvent, (event) => {
      this.handleTurnStart(event.province);
    });

    const current = this.context.world.turnQueue.current;

    if (current) {
      this.showProvince(current);
    }
  }

  private handleTurnStart(province: Province): void {
    if (province.isOwner(this.context.world.player)) {
      this.view.showTurn(province);
      this.showProvince(province);
    }
  }

  private selectProvince(provinceNumber: number): void {
    if (this.selected === provinceNumber) {
      this.selected = undefined;

      this.controls.worldMap.clearHighlighting();
      this.controls.gamePanel.showHint();
    } else {
      const { map } = this.context.world;

      this.showProvince(map.getProvince(provinceNumber));
    }
  }

  private showProvince(province: Province): void {
    this.selected = province.number;

    this.controls.worldMap.highlight(province);
    this.controls.gamePanel.showProvince(province);
  }
}
