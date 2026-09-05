import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';

import { ProvinceSelectedEvent } from './ProvinceSelectedEvent';
import type { WorldMapContext } from './types';
import { WorldMapView } from './WorldMapView';

export class WorldMapControl extends Control<WorldMapView> {
  public constructor(context: WorldMapContext) {
    super(WorldMapView, context);
  }

  public onProvinceSelected(handler: (province: Province) => void): void {
    this.subscribe(ProvinceSelectedEvent, (event) => {
      handler(this.context.map.getProvince(event.provinceNumber));
    });
  }

  public showCurrent(province: Province): void {
    this.clearHighlighting();
    this.view.addHighlighting(province.number, 'current');
  }

  public actualizeProvince(province: Province): void {
    this.view.actualizeProvince(province);
  }

  public showSelectable(provinceNumbers: readonly number[]): void {
    for (const provinceNumber of provinceNumbers) {
      this.view.addHighlighting(provinceNumber, 'selectable');
    }
  }

  public showSelected(provinceNumber: number): void {
    this.view.addHighlighting(provinceNumber, 'selected');
  }

  public clearHighlighting(): void {
    this.view.clearHighlighting();
  }
}
