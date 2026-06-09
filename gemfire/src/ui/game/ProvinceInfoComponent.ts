import type { Province } from '@/core/domain/Province';
import { Component } from '@/ui/Component';

interface ProvinceSelection {
  province: Province;
  neighbors: readonly Province[];
}

export class ProvinceInfoComponent extends Component {
  protected readonly rootClass = 'province-info';

  private selection: ProvinceSelection | undefined;

  public showHint(): void {
    this.selection = undefined;
    this.rerender();
  }

  public showProvince(
    province: Province,
    neighbors: readonly Province[],
  ): void {
    this.selection = { province, neighbors };
    this.rerender();
  }

  public render(): string {
    return this.selection
      ? this.renderProvince(this.selection)
      : this.renderHint();
  }

  private renderHint(): string {
    return `
      <section class="${this.rootClass}">
        <p class="${this.rootClass}__hint">Select a province.</p>
      </section>
    `;
  }

  private renderProvince(selection: ProvinceSelection): string {
    const { province, neighbors } = selection;

    return `
      <section class="${this.rootClass}">
        <h2>${province}</h2>
        <p>Owner: ${province.owner?.name ?? 'Neutral'}</p>
        <p>Gov: ${province.governor?.name ?? '—'}</p>
        <div class="${this.rootClass}__stats">
          <div class="${this.rootClass}__column">
            <h3>Resources</h3>
            <p>Gold ${province.resources.gold}</p>
            <p>Food ${province.resources.food}</p>
            <p>Troops ${province.resources.troops}</p>
          </div>
          <div class="${this.rootClass}__column">
            <h3>Development</h3>
            <p>Loyalty ${province.development.loyalty}</p>
            <p>Cultivation ${province.development.cultivation}</p>
            <p>Protection ${province.development.protection}</p>
          </div>
        </div>
        <p>Neighbors (${neighbors.length}): ${neighbors.join(', ')}</p>
      </section>
    `;
  }
}
