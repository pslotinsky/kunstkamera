import type { Scenario } from '@/config/scenarios';
import type { Province } from '@/core/domain/Province';
import type { WorldMap } from '@/core/domain/WorldMap';
import { WorldFactory } from '@/core/WorldFactory';
import { Control } from '@/lib/Control';
import { MapPreviewControl } from '@/ui/MapPreview/MapPreviewControl';
import { PlaqueControl } from '@/ui/Plaque/PlaqueControl';

import { ScenarioMapView } from './ScenarioMapView';
import type { ScenarioMapControls } from './types';

export class ScenarioMapControl extends Control<
  ScenarioMapView,
  ScenarioMapControls
> {
  public constructor() {
    super(
      ScenarioMapView,
      {},
      {
        map: new MapPreviewControl(),
        date: new PlaqueControl({ name: 'date' }),
      },
    );
  }

  public show(scenario: Scenario, map: WorldMap, caption = ''): void {
    const startDate = new WorldFactory().getStartDate(scenario);

    this.controls.map.showMap(map);
    this.controls.date.showTitle(String(startDate));
    this.view.showTitle(scenario.name, caption);
  }

  public highlight(provinces: readonly Province[]): void {
    this.controls.map.highlight(provinces);
  }
}
