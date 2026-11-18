import type { Scenario } from '@/config/scenarios';
import { WorldFactory } from '@/core/WorldFactory';
import { Control } from '@/lib/Control';

import { ScenarioSelectedEvent } from './events/ScenarioSelectedEvent';
import { MapPreviewControl } from './MapPreview/MapPreviewControl';
import { ScenarioSelectView } from './ScenarioSelectView';
import type { ScenarioSelectContext, ScenarioSelectControls } from './types';

export class ScenarioSelectControl extends Control<
  ScenarioSelectView,
  ScenarioSelectControls
> {
  private selected: Scenario;

  public constructor(context: ScenarioSelectContext) {
    const [first] = context.scenarios;

    if (!first) {
      throw new Error('No scenario to select');
    }

    const map = new WorldFactory().createMap(first);

    super(ScenarioSelectView, context, {
      mapPreview: new MapPreviewControl({ map }),
    });
    this.selected = first;
  }

  public get scenario(): Scenario {
    return this.selected;
  }

  public show(): void {
    this.view.show();
  }

  public hide(): void {
    this.view.hide();
  }

  protected override onMount(): void {
    this.subscribe(ScenarioSelectedEvent, (event) =>
      this.select(event.scenario),
    );
    this.view.showSelected(this.selected);
  }

  private select(scenario: Scenario): void {
    const map = new WorldFactory().createMap(scenario);

    this.selected = scenario;
    this.view.showSelected(scenario);
    this.controls.mapPreview.showMap(map);
  }
}
