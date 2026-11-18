import type { Scenario } from '@/config/scenarios';
import type { ChildrenViews } from '@/lib/Control';

import type { MapPreviewControl } from './MapPreview/MapPreviewControl';

export interface ScenarioSelectContext {
  readonly scenarios: readonly Scenario[];
}

export type ScenarioSelectControls = {
  readonly mapPreview: MapPreviewControl;
};

export type ScenarioSelectViews = ChildrenViews<ScenarioSelectControls>;
