import type { Scenario } from '@/config/scenarios';
import type { ChildrenViews } from '@/lib/Control';
import type { ScenarioMapControl } from '@/ui/Setup/ScenarioMap/ScenarioMapControl';
import type { TileGridControl } from '@/ui/Setup/TileGrid/TileGridControl';

import type { ScenarioPreviewControl } from './ScenarioPreview/ScenarioPreviewControl';

export interface ScenarioSelectContext {
  readonly scenarios: readonly Scenario[];
}

export type ScenarioSelectControls = {
  readonly scenarios: TileGridControl;
  readonly preview: ScenarioPreviewControl;
  readonly map: ScenarioMapControl;
};

export type ScenarioSelectViews = ChildrenViews<ScenarioSelectControls>;
