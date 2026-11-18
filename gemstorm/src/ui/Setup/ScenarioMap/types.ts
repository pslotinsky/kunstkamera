import type { ChildrenViews } from '@/lib/Control';
import type { MapPreviewControl } from '@/ui/MapPreview/MapPreviewControl';
import type { PlaqueControl } from '@/ui/Plaque/PlaqueControl';

export type ScenarioMapControls = {
  readonly map: MapPreviewControl;
  readonly date: PlaqueControl;
};

export type ScenarioMapViews = ChildrenViews<ScenarioMapControls>;
