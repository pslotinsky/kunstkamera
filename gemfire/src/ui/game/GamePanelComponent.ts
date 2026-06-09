import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { Component } from '@/ui/Component';
import { ProvinceInfoComponent } from './ProvinceInfoComponent';

export class GamePanelComponent extends Component {
  protected readonly rootClass = 'game-panel';

  private readonly world: World;
  private readonly provinceInfo = new ProvinceInfoComponent();

  public constructor(world: World) {
    super();
    this.world = world;
  }

  public showHint(): void {
    this.provinceInfo.showHint();
  }

  public showProvince(
    province: Province,
    neighbors: readonly Province[],
  ): void {
    this.provinceInfo.showProvince(province, neighbors);
  }

  public render(): string {
    return `
      <aside class="${this.rootClass}">
        <p class="${this.rootClass}__date">${this.world.date}</p>
        ${this.provinceInfo.render()}
      </aside>
    `;
  }

  protected override onMount(): void {
    this.provinceInfo.attach(this.element);
  }
}
