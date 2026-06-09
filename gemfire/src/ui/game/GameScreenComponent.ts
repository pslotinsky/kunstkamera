import type { World } from '@/core/domain/World';
import { Component } from '@/ui/Component';
import { WorldMapComponent } from './WorldMapComponent';
import { GamePanelComponent } from './GamePanelComponent';
import { ProvinceSelectedEvent } from './ProvinceSelectedEvent';

export class GameScreenComponent extends Component {
  protected readonly rootClass = 'game-screen';

  private readonly world: World;
  private readonly worldMap: WorldMapComponent;
  private readonly gamePanel: GamePanelComponent;
  private selected?: number | undefined;

  public constructor(world: World) {
    super();
    this.world = world;
    this.worldMap = new WorldMapComponent();
    this.gamePanel = new GamePanelComponent(world);
  }

  public render(): string {
    return `
      <div class="${this.rootClass}">
        ${this.gamePanel.render()}
        ${this.worldMap.render()}
      </div>
    `;
  }

  protected override onMount(): void {
    this.gamePanel.attach(this.element);
    this.worldMap.attach(this.element);
    this.worldMap.listen(ProvinceSelectedEvent, (event) => {
      this.selectProvince(event.provinceNumber);
    });
  }

  private selectProvince(provinceNumber: number): void {
    if (this.selected === provinceNumber) {
      this.selected = undefined;

      this.worldMap.clearHighlighting();
      this.gamePanel.showHint();
    } else {
      this.selected = provinceNumber;

      const map = this.world.map;
      const province = map.getProvince(provinceNumber);
      const neighbors = map.getNeighbors(province);
      this.worldMap.highlight(province);
      this.gamePanel.showProvince(province, neighbors);
    }
  }
}
