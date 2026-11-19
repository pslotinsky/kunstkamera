import type { Province } from '@/core/domain/Province';
import type { WorldMap } from '@/core/domain/WorldMap';
import { Control } from '@/lib/Control';

import { MapPreviewView } from './MapPreviewView';

export class MapPreviewControl extends Control<MapPreviewView> {
  public constructor() {
    super(MapPreviewView, {});
  }

  public showMap(map: WorldMap): void {
    this.view.showMap(map);
  }

  public highlight(provinces: readonly Province[]): void {
    this.view.highlight(provinces);
  }
}
