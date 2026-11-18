import type { Scenario } from '@/config/scenarios';
import { WorldFactory } from '@/core/WorldFactory';
import { Control } from '@/lib/Control';
import { ScenarioMapControl } from '@/ui/Setup/ScenarioMap/ScenarioMapControl';
import { TileSelectedEvent } from '@/ui/Setup/TileGrid/events/TileSelectedEvent';
import { TileGridControl } from '@/ui/Setup/TileGrid/TileGridControl';
import type { Tile } from '@/ui/Setup/TileGrid/TileGridView';

import { ScenarioPreviewControl } from './ScenarioPreview/ScenarioPreviewControl';
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

    super(ScenarioSelectView, context, {
      scenarios: new TileGridControl({
        name: 'scenarios',
        size: context.scenarios.length,
        picture: 'none',
      }),
      preview: new ScenarioPreviewControl(),
      map: new ScenarioMapControl(),
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
    const { scenarios } = this.controls;

    scenarios.view.subscribe(TileSelectedEvent, (event) =>
      this.select(event.key),
    );
    scenarios.showTiles(
      this.context.scenarios.map((scenario) => this.toTile(scenario)),
    );
    this.select(this.toTile(this.selected).key);
  }

  private select(key: string): void {
    const scenario = this.context.scenarios.find(
      (candidate) => this.toTile(candidate).key === key,
    );

    if (scenario) {
      const map = new WorldFactory().createMap(scenario);

      this.selected = scenario;
      this.controls.scenarios.select(key);
      this.controls.preview.showScenario(scenario);
      this.controls.map.show(scenario, map);
    }
  }

  private toTile(scenario: Scenario): Tile {
    return {
      key: String(scenario.number),
      label: scenario.name,
    };
  }
}
