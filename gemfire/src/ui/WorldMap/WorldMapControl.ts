import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';
import { WorldMapView } from './WorldMapView';
import type { WorldMapContext } from './types';

export class WorldMapControl extends Control<WorldMapView> {
  public constructor(context: WorldMapContext) {
    super(WorldMapView, context);
  }

  public highlight(province: Province): void {
    this.clearHighlighting();

    this.view.addHighlighting(province.number, 'selected');

    for (const neighborNumber of province.neighbors) {
      this.view.addHighlighting(neighborNumber, 'neighbor');
    }
  }

  public clearHighlighting(): void {
    this.view.clearHighlighting();
  }
}
