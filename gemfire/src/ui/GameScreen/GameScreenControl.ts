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
      worldMap: new WorldMapControl(),
      gamePanel: new GamePanelControl({ world: context.world }),
    });
  }

  protected override onMount(): void {
    this.controls.worldMap.listen(ProvinceSelectedEvent, (event) => {
      this.selectProvince(event.provinceNumber);
    });
  }

  private selectProvince(provinceNumber: number): void {
    if (this.selected === provinceNumber) {
      this.selected = undefined;

      this.controls.worldMap.clearHighlighting();
      this.controls.gamePanel.showHint();
    } else {
      this.selected = provinceNumber;

      const map = this.context.world.map;
      const province = map.getProvince(provinceNumber);
      const neighbors = map.getNeighbors(province);

      this.controls.worldMap.highlight(province);
      this.controls.gamePanel.showProvince(province, neighbors);
    }
  }
}
