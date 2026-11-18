import type { WorldMap } from '@/core/domain/WorldMap';
import { Control } from '@/lib/Control';

import { type MapPreviewContext, MapPreviewView } from './MapPreviewView';

export class MapPreviewControl extends Control<MapPreviewView> {
  public constructor(context: MapPreviewContext) {
    super(MapPreviewView, context);
  }

  public showMap(map: WorldMap): void {
    this.view.showMap(map);
  }
}
